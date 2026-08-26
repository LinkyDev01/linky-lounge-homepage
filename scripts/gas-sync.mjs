#!/usr/bin/env node
// ============================================================
// GAS 자동 편집·배포 CLI (2026-08-13)
// ============================================================
// CLAUDE.md §6 의 수작업 절차 —
//   "레포 수정 → 운영자가 GAS 편집기에 붙여넣기 → 배포 관리 → 기존 배포 편집 → 새 버전"
// 을 Apps Script REST API 로 자동화한다. 레포의 gas/*.gs 가 실배포의 원본이 된다.
//
// ⚠ 설계 원칙 (깨뜨리지 말 것)
//   1. 배포는 **항상 기존 배포 갱신**(deployments.update). deployments.create 는
//      이 스크립트에 없다 — 새 배포를 만들면 웹앱 URL 이 바뀌어 프론트가 끊긴다.
//   2. push 전 **실배포본이 기준선과 같은지** 먼저 확인한다. 다르면(= 운영자가
//      편집기에서 직접 고쳤다) 덮어쓰지 않고 멈춘다. 레포 미러보다 실배포본이
//      최신일 수 있다는 §6 경고를 코드로 강제한 것.
//   3. updateContent 는 **파일 전체를 치환**한다. 실배포에만 있는 파일이 발견되면
//      (= 조용히 삭제될 파일) 멈춘다.
//   4. 비밀값(스크립트 속성 ADMIN_TOKEN/SOLAPI_*)은 코드가 아니라 GAS 프로젝트
//      속성에 있으므로 이 경로로 오가지 않는다. 여기서 다루는 건 소스뿐이다.
//
// 사용법
//   node scripts/gas-sync.mjs status                 배포·버전·드리프트 현황
//   node scripts/gas-sync.mjs check                  실배포 ↔ 레포 diff (다르면 exit 1)
//   node scripts/gas-sync.mjs pull                   실배포 → 레포 (운영자 직접 편집분 회수)
//   node scripts/gas-sync.mjs push [--baseline REF]  레포 → 실배포 (저장만, 배포 아님)
//   node scripts/gas-sync.mjs deploy [-m "설명"]     push + 새 버전 + 기존 배포 갱신 + 검증
//   node scripts/gas-sync.mjs rollback <버전번호>    기존 배포를 이전 버전으로 되돌림
//   node scripts/gas-sync.mjs auth                   (로컬 PC) 리프레시 토큰 발급
//   node scripts/gas-sync.mjs auth-url               (헤드리스) 동의 URL 출력
//   node scripts/gas-sync.mjs auth-exchange <code>   (헤드리스) 코드 → 리프레시 토큰
//
// 공통 옵션: --dry-run (쓰기 없이 무엇을 할지만 출력), --json
//
// 환경변수
//   GAS_SCRIPT_ID       (필수) Apps Script 프로젝트 ID
//   GAS_REFRESH_TOKEN   (필수, auth 계열 제외) OAuth 리프레시 토큰
//   GAS_DEPLOYMENT_ID   배포 ID. 없으면 GAS_WEBAPP_URL / INTERVIEW_GAS_URL 에서 추출
//   GAS_WEBAPP_URL      .../macros/s/<배포ID>/exec — deploy 후 스모크 테스트에도 쓴다
//   GAS_CLIENT_ID/SECRET  자체 GCP OAuth 클라이언트를 쓸 때만 (기본값은 아래 참조)
// ============================================================

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import http from 'node:http'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GAS_DIR = path.join(ROOT, 'gas')
const CONFIG_PATH = path.join(GAS_DIR, 'project.json')

const API = 'https://script.googleapis.com/v1'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const REDIRECT_PORT = 2255
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`

// @google/clasp 가 공개 배포물에 담아 두는 데스크톱 OAuth 클라이언트.
// 데스크톱 클라이언트의 secret 은 설계상 비밀이 아니다(RFC 8252) — 다만 이 클라이언트는
// 이미 '게시됨' 상태라 리프레시 토큰이 7일 만에 만료되지 않는다(테스트 상태 클라이언트의 함정).
// 자체 GCP 클라이언트를 쓰려면 GAS_CLIENT_ID/GAS_CLIENT_SECRET 로 덮어쓴다.
const DEFAULT_CLIENT_ID = '1072944905499-vm2v2i5dvn0a0d2o4ca36i1vge8cvbn0.apps.googleusercontent.com'
const DEFAULT_CLIENT_SECRET = 'v6V3fKV_zWU7iw1DrpO1rknX'

// 최소 권한만 요청한다. clasp 기본 로그인은 cloud-platform·drive.file·logging 까지
// 10종을 한꺼번에 받아 두는데, 토큰이 새면 피해 범위가 그만큼 넓어진다.
const SCOPES = [
  'https://www.googleapis.com/auth/script.projects', // 소스 읽기·쓰기
  'https://www.googleapis.com/auth/script.deployments', // 버전·배포 갱신
]

const PKCE_STATE_PATH = path.join(os.tmpdir(), 'gas-sync-pkce.json')

// ── 유틸 ────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const command = argv[0]
const flags = {
  dryRun: argv.includes('--dry-run'),
  json: argv.includes('--json'),
  allowDrift: argv.includes('--allow-drift'),
  baseline: readOpt('--baseline'),
  message: readOpt('-m') ?? readOpt('--message'),
}

function readOpt(name) {
  const i = argv.indexOf(name)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined
}

function log(...a) {
  if (!flags.json) console.log(...a)
}

function fail(msg, hint) {
  console.error(`\n✖ ${msg}`)
  if (hint) console.error(`  → ${hint}`)
  process.exit(1)
}

function env(name) {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : undefined
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) fail(`설정 파일이 없습니다: ${path.relative(ROOT, CONFIG_PATH)}`)
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
}

function scriptId() {
  return env('GAS_SCRIPT_ID') ?? fail('GAS_SCRIPT_ID 가 설정되지 않았습니다', 'docs/gas-automation.md §설정 참고')
}

/** 배포 ID는 웹앱 URL(.../macros/s/<ID>/exec)에서도 뽑을 수 있다 — Vercel 에 이미 있는 값이라 재입력을 줄인다 */
function deploymentId() {
  const direct = env('GAS_DEPLOYMENT_ID')
  if (direct) return direct
  const url = webappUrl()
  const m = url?.match(/\/macros\/s\/([^/]+)\/(?:exec|dev)/)
  if (m) return m[1]
  return fail('GAS_DEPLOYMENT_ID 도 GAS_WEBAPP_URL 도 없습니다', '둘 중 하나는 있어야 "기존 배포 갱신"을 할 수 있습니다')
}

function webappUrl() {
  return env('GAS_WEBAPP_URL') ?? env('INTERVIEW_GAS_URL')
}

/**
 * 비교·전송용 정규화. 줄바꿈(CRLF)과 **파일 끝 공백/개행**만 없앤다 —
 * 편집기는 마지막 개행을 붙이지 않고 레포 파일에는 있어서, 그대로 비교하면
 * 매번 가짜 드리프트가 잡힌다. 줄 안쪽 공백은 진짜 차이로 본다.
 */
function normalize(src) {
  const t = src.replace(/\r\n/g, '\n').replace(/[\s﻿]+$/, '')
  return t ? `${t}\n` : ''
}

function sha(src) {
  return crypto.createHash('sha256').update(normalize(src)).digest('hex').slice(0, 12)
}

// ── OAuth ───────────────────────────────────────────────────
function clientCreds() {
  return {
    clientId: env('GAS_CLIENT_ID') ?? DEFAULT_CLIENT_ID,
    clientSecret: env('GAS_CLIENT_SECRET') ?? DEFAULT_CLIENT_SECRET,
  }
}

async function accessToken() {
  const refresh = env('GAS_REFRESH_TOKEN')
  if (!refresh) {
    fail(
      'GAS_REFRESH_TOKEN 이 없습니다',
      'node scripts/gas-sync.mjs auth 로 발급하거나, GitHub Actions 라면 secrets 에 등록하세요',
    )
  }
  const { clientId, clientSecret } = clientCreds()
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    fail(
      `토큰 갱신 실패 (${res.status} ${body.error ?? ''}) ${body.error_description ?? ''}`,
      body.error === 'invalid_grant'
        ? '리프레시 토큰이 철회되었거나 만료되었습니다. auth 로 재발급하세요'
        : undefined,
    )
  }
  return body.access_token
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let cachedToken = null

/**
 * ⚠ **읽기만 재시도한다** (2026-08-26).
 *   `script.googleapis.com` 이 이따금 JSON 대신 **503 HTML** 을 뱉는다 — 구글 쪽 일시 장애로,
 *   run #11·#12·#15·#17 네 번 이 증상으로 워크플로가 죽었고 그중 두 번은 실제 작업을 막았다.
 *   한 번 찔러 보고 치명으로 단정할 이유가 없다.
 *   **쓰기(PUT·POST)는 재시도하지 않는다** — 응답만 유실되고 서버엔 반영됐을 수 있어
 *   versions.create 가 중복 버전을 만들 여지가 있다. 쓰기가 503 을 맞으면 종전대로 실패하고,
 *   운영자가 다시 돌리면 된다(그 경로는 이미 안전하다).
 */
const API_READ_RETRY_WAITS = [0, 3_000, 9_000]

async function api(method, urlPath, body) {
  const token = (cachedToken ??= await accessToken())
  const isRead = method === 'GET'
  const waits = isRead ? API_READ_RETRY_WAITS : [0]
  let res, text, json

  for (let i = 0; i < waits.length; i++) {
    if (waits[i]) await sleep(waits[i])
    res = await fetch(`${API}${urlPath}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    text = await res.text()
    json = undefined
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      /* 아래에서 처리 */
    }
    // 일시 장애로 보이는 것만 다시 본다: 본문이 JSON 이 아니거나 5xx
    const transient = json === undefined || res.status >= 500
    if (!transient || i === waits.length - 1) break
    log(`  … Apps Script API 가 ${res.status} 를 줬습니다 — 다시 시도합니다 (${i + 2}/${waits.length})`)
  }

  if (json === undefined) {
    fail(
      `Apps Script API 가 JSON 이 아닌 응답을 보냈습니다 (${res.status})`,
      (isRead ? '구글 쪽 일시 장애일 수 있습니다 — 잠시 뒤 다시 실행해 보세요. ' : '') + text.slice(0, 200),
    )
  }
  if (!res.ok) {
    const msg = json?.error?.message ?? text.slice(0, 200)
    const hint =
      res.status === 403 && /API has not been used|not enabled/i.test(msg)
        ? 'https://script.google.com/home/usersettings 에서 "Google Apps Script API"를 켜세요'
        : res.status === 404
          ? 'GAS_SCRIPT_ID 가 맞는지, 토큰 계정이 그 프로젝트의 편집 권한을 갖는지 확인하세요'
          : undefined
    fail(`Apps Script API ${method} ${urlPath} → ${res.status}: ${msg}`, hint)
  }
  return json
}

// ── 콘텐츠 읽기/쓰기 ────────────────────────────────────────
async function fetchLive() {
  const { files } = await api('GET', `/projects/${scriptId()}/content`)
  return files ?? []
}

/** 레포 파일들을 updateContent 가 받는 형태로 만든다 */
function buildLocal(config) {
  const files = []
  for (const f of config.files) {
    const p = path.join(GAS_DIR, f.local)
    if (!fs.existsSync(p)) fail(`레포에 파일이 없습니다: gas/${f.local}`)
    files.push({ name: f.remote, type: f.type, source: normalize(fs.readFileSync(p, 'utf8')) })
  }
  return files
}

function localPathFor(config, remoteName) {
  return config.files.find((f) => f.remote === remoteName)?.local
}

function diffText(aLabel, a, bLabel, b) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-diff-'))
  const pa = path.join(dir, 'a')
  const pb = path.join(dir, 'b')
  fs.writeFileSync(pa, normalize(a))
  fs.writeFileSync(pb, normalize(b))
  const r = spawnSync('diff', ['-u', '--label', aLabel, '--label', bLabel, pa, pb], { encoding: 'utf8' })
  fs.rmSync(dir, { recursive: true, force: true })
  return r.stdout ?? ''
}

/**
 * 실배포본 ↔ 레포 대조.
 * @returns {{same: boolean, report: string, missingLocal: string[], changed: string[]}}
 */
function compare(live, local, config) {
  const liveByName = new Map(live.map((f) => [f.name, f]))
  const localByName = new Map(local.map((f) => [f.name, f]))

  // updateContent 는 전체 치환 — 매핑에 없는 실배포 파일은 조용히 삭제된다
  const missingLocal = live.filter((f) => !localByName.has(f.name)).map((f) => f.name)
  const extraLocal = local.filter((f) => !liveByName.has(f.name)).map((f) => f.name)

  const changed = []
  let report = ''
  for (const lf of local) {
    const rf = liveByName.get(lf.name)
    if (!rf) continue
    if (normalize(rf.source) !== normalize(lf.source)) {
      changed.push(lf.name)
      report += diffText(`실배포: ${lf.name}`, rf.source, `레포: gas/${localPathFor(config, lf.name)}`, lf.source)
    }
  }
  return { same: changed.length === 0 && missingLocal.length === 0 && extraLocal.length === 0, report, missingLocal, extraLocal, changed }
}

/** 그 커밋이 이 클론에 있는가 */
function gitHas(ref) {
  try {
    execFileSync('git', ['cat-file', '-e', `${ref}^{commit}`], { cwd: ROOT, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * **마지막으로 배포한 커밋**을 실배포 쪽에서 읽어 온다 — 기준선의 사실 근거.
 *
 * cmdDeploy 가 배포 설명을 `auto: <짧은SHA> <커밋 제목>` 으로 적어 두므로, 배포 자체가
 * "우리가 무엇을 올렸는가"의 원장이다. 종전의 `HEAD~1` 추정은 **GAS 커밋 뒤에 다른 커밋이
 * 하나라도 얹히면 무너진다** — HEAD~1 이 이미 신코드라, 실배포(구코드)와 달라 가짜
 * 드리프트가 잡힌다 (2026-08-25 실측: 문서 커밋 #491 이 얹혀 배포가 막혔다).
 *
 * 설명이 `auto:` 로 시작할 때만 신뢰한다 — 운영자가 -m 으로 직접 쓴 설명은 SHA 가 아니다.
 */
async function deployedBaselineRef() {
  let description = ''
  try {
    const d = await api('GET', `/projects/${scriptId()}/deployments/${deploymentId()}`)
    description = d.deploymentConfig?.description ?? ''
  } catch {
    return null
  }
  const m = description.match(/^auto:\s*([0-9a-f]{7,40})\b/)
  if (!m) return null
  const sha = m[1]
  if (gitHas(sha)) return sha
  // 얕은 클론이면 그 커밋이 없다. 짧은 SHA 는 targeted fetch 가 안 되므로(전체 40자만
  // 가능) 여기서 되살릴 방법이 없다 — 워크플로가 전체 이력을 받아 오게 해 둔 이유다
  // (.github/workflows/gas-deploy.yml: fetch-depth 0 + filter blob:none).
  log(`⚠ 마지막 배포 커밋 ${sha} 가 이 클론에 없습니다 — 기준선을 추정값으로 대체합니다`)
  return null
}

/** 기준선(git ref) 시점의 파일 내용. 그 시점에 없던 파일이면 null */
function baselineSource(localName, ref) {
  try {
    return normalize(
      execFileSync('git', ['show', `${ref}:gas/${localName}`], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'], // 기준선에 없는 파일일 때의 git 오류 출력은 감춘다
      }),
    )
  } catch {
    return null
  }
}

/**
 * push 전 안전 점검 — "실배포본이 우리가 마지막으로 올린 그대로인가".
 * 다르면 운영자가 편집기에서 직접 고친 것이므로 덮어쓰지 않고 멈춘다.
 *
 * 기준선에 없던 파일(= 레포에 이번에 처음 들어온 매핑)은 비교할 과거가 없으므로,
 * "지금 올릴 내용과 실배포본이 이미 같은가"로 대신 판정한다 — 같으면 잃을 게 없고,
 * 다르면 편집기 쪽 내용을 지우는 셈이라 멈춘다. (파일 하나가 신규라고 해서
 * 나머지 파일의 검사까지 통째로 건너뛰면 가드가 조용히 무력화된다)
 */
async function guardBaseline(live, local, config) {
  if (flags.allowDrift) {
    log('⚠ --allow-drift: 기준선 검사를 건너뜁니다')
    return
  }
  // 기준선 우선순위: ① 실배포에 기록된 마지막 배포 커밋(사실) → ② --baseline → ③ HEAD~1(추정)
  const deployed = await deployedBaselineRef()
  const ref = deployed ?? flags.baseline ?? 'HEAD~1'
  if (deployed) log(`기준선: 실배포에 기록된 마지막 배포 커밋 ${deployed}`)
  const liveByName = new Map(live.map((f) => [f.name, f]))
  const localByName = new Map(local.map((f) => [f.name, f]))
  const offenders = []
  let report = ''

  for (const f of config.files) {
    const liveFile = liveByName.get(f.remote)
    if (!liveFile) continue // 실배포에 없는 파일 = 새로 생성될 파일, 잃을 내용이 없다
    const base = baselineSource(f.local, ref)
    const expected = base ?? normalize(localByName.get(f.remote)?.source ?? '')
    if (normalize(liveFile.source) === expected) continue
    offenders.push(f.remote + (base ? '' : ' (기준선 없음 — 신규 매핑)'))
    report += diffText(`실배포: ${f.remote}`, liveFile.source, `기준선(${base ? ref : '올릴 내용'}): gas/${f.local}`, expected)
  }

  if (offenders.length) {
    console.error(report)
    fail(
      `실배포본이 기준선(${ref}${deployed ? ' — 마지막 배포 커밋' : ''})과 다릅니다 — 편집기에서 직접 수정된 내용으로 보입니다: ${offenders.join(', ')}`,
      'node scripts/gas-sync.mjs pull 로 회수해 커밋한 뒤 다시 시도하세요 (의도적으로 덮어쓸 거라면 --allow-drift)',
    )
  }
  log(`✔ 기준선 검사 통과 (${ref})`)
}

// ── 명령 ────────────────────────────────────────────────────
async function cmdStatus() {
  const config = loadConfig()
  const [live, deployments, versions] = await Promise.all([
    fetchLive(),
    api('GET', `/projects/${scriptId()}/deployments?pageSize=20`),
    api('GET', `/projects/${scriptId()}/versions?pageSize=5`),
  ])
  const local = buildLocal(config)
  const cmp = compare(live, local, config)
  const target = deploymentId()

  if (flags.json) {
    console.log(
      JSON.stringify(
        {
          scriptId: scriptId(),
          deploymentId: target,
          drift: !cmp.same,
          changed: cmp.changed,
          liveFiles: live.map((f) => ({ name: f.name, type: f.type, sha: sha(f.source) })),
          deployments: deployments.deployments ?? [],
          latestVersion: versions.versions?.[0]?.versionNumber ?? null,
        },
        null,
        2,
      ),
    )
    return
  }

  log(`스크립트    ${scriptId()}`)
  log(`대상 배포   ${target}`)
  log('')
  log('실배포 파일')
  for (const f of live) log(`  · ${f.name}.${f.type.toLowerCase()}  ${f.source.length}자  sha:${sha(f.source)}`)
  log('')
  log('배포 목록')
  for (const d of deployments.deployments ?? []) {
    const web = d.entryPoints?.find((e) => e.entryPointType === 'WEB_APP')
    const mark = d.deploymentId === target ? '▶' : ' '
    log(
      `  ${mark} ${d.deploymentId}  v${d.deploymentConfig?.versionNumber ?? 'HEAD'}  ${d.deploymentConfig?.description ?? ''}`,
    )
    if (web) log(`      ${web.webApp?.url}`)
  }
  log('')
  log(`최신 버전   v${versions.versions?.[0]?.versionNumber ?? '-'}`)
  log('')
  log(cmp.same ? '✔ 실배포본과 레포 미러가 같습니다' : `⚠ 드리프트: ${cmp.changed.join(', ') || '파일 구성 불일치'}`)
}

async function cmdCheck() {
  const config = loadConfig()
  const live = await fetchLive()
  const local = buildLocal(config)
  const cmp = compare(live, local, config)

  if (cmp.same) {
    log('✔ 실배포본과 레포 미러가 같습니다 (드리프트 없음)')
    return
  }
  if (cmp.missingLocal.length) {
    console.error(`⚠ 실배포에만 있는 파일 (레포 매핑 누락 — push 하면 삭제됩니다): ${cmp.missingLocal.join(', ')}`)
  }
  if (cmp.extraLocal.length) {
    log(`ℹ 레포에만 있는 파일 (push 하면 새로 생성): ${cmp.extraLocal.join(', ')}`)
  }
  if (cmp.report) console.log(cmp.report)
  console.error(`\n✖ 드리프트 ${cmp.changed.length}건 — 실배포본과 레포가 다릅니다`)
  process.exit(1)
}

async function cmdPull() {
  const config = loadConfig()
  const live = await fetchLive()
  let written = 0
  for (const f of live) {
    const localName = localPathFor(config, f.name)
    if (!localName) {
      log(`ℹ 매핑에 없는 실배포 파일: ${f.name}.${f.type.toLowerCase()} — gas/project.json 에 추가하세요`)
      continue
    }
    const p = path.join(GAS_DIR, localName)
    const before = fs.existsSync(p) ? normalize(fs.readFileSync(p, 'utf8')) : null
    const after = normalize(f.source)
    if (before === after) {
      log(`  = gas/${localName}`)
      continue
    }
    if (flags.dryRun) {
      log(`  ~ gas/${localName} (dry-run — 쓰지 않음)`)
    } else {
      fs.writeFileSync(p, after)
      log(`  ✎ gas/${localName}`)
    }
    written++
  }
  if (!written) log('\n변경 없음')
  else if (flags.dryRun) log(`\n${written}개 파일이 갱신될 예정입니다 (dry-run)`)
  else log(`\n${written}개 파일을 실배포본으로 갱신했습니다 — git diff 로 확인 후 커밋하세요`)
}

async function cmdPush() {
  const config = loadConfig()
  const live = await fetchLive()
  const local = buildLocal(config)
  const cmp = compare(live, local, config)

  if (cmp.missingLocal.length) {
    fail(
      `실배포에만 있는 파일이 있습니다: ${cmp.missingLocal.join(', ')}`,
      'push 는 파일 전체를 치환하므로 그 파일들이 삭제됩니다. gas/project.json 에 매핑을 추가하고 pull 하세요',
    )
  }
  if (cmp.same) {
    log('✔ 이미 같습니다 — push 할 내용이 없습니다')
    return { pushed: false }
  }

  await guardBaseline(live, local, config)

  log(`변경 파일: ${cmp.changed.join(', ') || cmp.extraLocal.join(', ')}`)
  if (cmp.report) log(cmp.report)

  if (flags.dryRun) {
    log('(dry-run — 실제로 올리지 않았습니다)')
    return { pushed: false }
  }

  await api('PUT', `/projects/${scriptId()}/content`, { files: local })

  // 되읽어 실제로 반영됐는지 확인 — "됐을 것"으로 끝내지 않는다
  const after = compare(await fetchLive(), local, config)
  if (!after.same) fail('push 후 대조 실패 — 실배포본이 레포와 다릅니다', '수동 확인이 필요합니다')
  log('✔ 실배포 소스 갱신 완료 (아직 배포 아님 — 사용자에게 반영되려면 deploy 필요)')
  return { pushed: true }
}

async function cmdDeploy() {
  const target = deploymentId()
  const before = await api('GET', `/projects/${scriptId()}/deployments/${target}`)
  const beforeUrl = before.entryPoints?.find((e) => e.entryPointType === 'WEB_APP')?.webApp?.url
  const beforeVersion = before.deploymentConfig?.versionNumber

  const pushed = (await cmdPush())?.pushed

  // 소스가 그대로면, 지금 **서비스 중인 버전**이 이미 그 내용인지 보고 같으면 배포를 생략한다.
  // (워크플로는 scripts/·워크플로 파일 변경에도 도는데, 그건 GAS 내용과 무관하다 —
  //  이 가드가 없으면 도구를 손볼 때마다 의미 없는 새 버전이 운영 배포에 얹힌다)
  if (!pushed && !flags.dryRun && beforeVersion) {
    const served = await api('GET', `/projects/${scriptId()}/content?versionNumber=${beforeVersion}`)
    const config = loadConfig()
    if (compare(served.files ?? [], buildLocal(config), config).same) {
      log(`✔ 이미 v${beforeVersion} 로 최신 — 배포 생략`)
      return
    }
    log(`ℹ 소스는 그대로지만 서비스 중인 v${beforeVersion} 가 뒤처져 있습니다 — 배포를 진행합니다`)
  }

  const description = flags.message ?? `auto: ${gitDescribe()}`

  if (flags.dryRun) {
    log(`(dry-run) 새 버전 생성 → 배포 ${target} 갱신 예정 · 설명 "${description}"`)
    return
  }

  const version = await api('POST', `/projects/${scriptId()}/versions`, { description })
  log(`✔ 새 버전 v${version.versionNumber} 생성`)

  const updated = await api('PUT', `/projects/${scriptId()}/deployments/${target}`, {
    deploymentConfig: {
      scriptId: scriptId(),
      versionNumber: version.versionNumber,
      manifestFileName: 'appsscript',
      description,
    },
  })
  const afterUrl = updated.entryPoints?.find((e) => e.entryPointType === 'WEB_APP')?.webApp?.url
  log(`✔ 기존 배포 갱신 v${beforeVersion ?? 'HEAD'} → v${version.versionNumber}`)

  // 웹앱 URL 이 그대로여야 한다. 바뀌면 프론트(INTERVIEW_GAS_URL)가 즉시 끊긴다
  if (beforeUrl && afterUrl && beforeUrl !== afterUrl) {
    fail(
      `웹앱 URL 이 바뀌었습니다!\n  이전: ${beforeUrl}\n  이후: ${afterUrl}`,
      `Vercel INTERVIEW_GAS_URL 을 즉시 갱신하거나, rollback ${beforeVersion} 으로 되돌리세요`,
    )
  }
  log(`✔ 웹앱 URL 불변 확인  ${afterUrl ?? '(웹앱 진입점 없음)'}`)

  await smokeTest(beforeVersion)
}

/**
 * 배포 직후 실제 웹앱을 찔러 살아 있는지 본다 (콜드 스타트 80초 사례가 있어 넉넉히 기다린다).
 *
 * ⚠ **재시도가 필요한 이유** (2026-08-26 실측): 배포 직후 몇 초 동안 웹앱이 JSON 대신
 *   HTML(콜드 스타트·구글 인터스티셜)을 돌려주는 창이 있다. 한 번만 찔러 보고 실패로
 *   단정하면 **배포는 멀쩡한데 워크플로만 빨개진다** — run #15 가 정확히 그랬고,
 *   그 오탐 때문에 '배포 실패'로 오인해 후속 병합이 한 라운드 밀렸다.
 *   (그때도 실제로는 v32→v33 갱신까지 다 끝나 있었고 웹앱은 정상이었다.)
 *   그래서 **간격을 두고 세 번**까지 본다. 세 번 다 JSON 이 아니면 그건 진짜 고장이다.
 */
async function smokeTest(rollbackVersion) {
  const url = webappUrl()
  if (!url) {
    log('ℹ GAS_WEBAPP_URL 이 없어 스모크 테스트를 건너뜁니다')
    return
  }
  const WAITS = [0, 10_000, 20_000] // 시도 전 대기 — 콜드 스타트가 풀릴 시간을 준다
  const started = Date.now()
  let last = null

  for (let i = 0; i < WAITS.length; i++) {
    if (WAITS[i]) await sleep(WAITS[i])
    log(`· 웹앱 스모크 테스트 ${i + 1}/${WAITS.length} (콜드 스타트면 최대 90초)...`)
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000), redirect: 'follow' })
      const text = await res.text()
      JSON.parse(text) // doGet 은 JSON 을 준다. HTML 이면 오류 페이지
      const elapsed = ((Date.now() - started) / 1000).toFixed(1)
      log(`✔ 스모크 테스트 통과 (${res.status}, ${elapsed}s${i ? `, ${i + 1}번째 시도` : ''})`)
      return
    } catch (e) {
      last = e
      if (i < WAITS.length - 1) log(`  … 아직 JSON 이 아닙니다 (${e.message}) — 다시 시도합니다`)
    }
  }

  console.error(`\n✖ 스모크 테스트 실패 (${WAITS.length}회 모두): ${last?.message}`)
  console.error('  배포는 이미 반영된 상태입니다. 되돌리려면:')
  console.error(`    node scripts/gas-sync.mjs rollback ${rollbackVersion ?? '<이전 버전번호>'}`)
  process.exit(1)
}

async function cmdRollback() {
  const version = Number(argv[1])
  if (!Number.isInteger(version)) fail('되돌릴 버전 번호를 주세요', 'node scripts/gas-sync.mjs rollback 12')
  const target = deploymentId()
  if (flags.dryRun) {
    log(`(dry-run) 배포 ${target} → v${version}`)
    return
  }
  await api('PUT', `/projects/${scriptId()}/deployments/${target}`, {
    deploymentConfig: {
      scriptId: scriptId(),
      versionNumber: version,
      manifestFileName: 'appsscript',
      description: `rollback to v${version}`,
    },
  })
  log(`✔ 배포 ${target} 를 v${version} 로 되돌렸습니다`)
  log('⚠ 레포 미러는 그대로입니다 — pull 로 실배포본을 회수해 커밋하세요')
}

function gitDescribe() {
  try {
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
    const subject = execFileSync('git', ['log', '-1', '--pretty=%s'], { cwd: ROOT, encoding: 'utf8' }).trim()
    return `${sha} ${subject}`.slice(0, 200)
  } catch {
    return new Date().toISOString()
  }
}

// ── OAuth 발급 ──────────────────────────────────────────────
function pkce() {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

function authUrl(challenge) {
  const { clientId } = clientCreds()
  const p = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // 리프레시 토큰을 확실히 받기 위해
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  // 스크립트 소유 계정이 아닌 계정으로 승인하면 권한이 없어 나중에 404 가 난다.
  // --account 로 계정 선택 화면을 미리 좁힌다 (구글의 힌트라 강제는 아님)
  const account = readOpt('--account')
  if (account) p.set('login_hint', account)
  return `${AUTH_ENDPOINT}?${p}`
}

async function exchange(code, verifier) {
  const { clientId, clientSecret } = clientCreds()
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.refresh_token) {
    fail(
      `토큰 교환 실패 (${res.status}): ${body.error ?? ''} ${body.error_description ?? ''}`,
      body.error === 'invalid_grant' ? '코드는 1회용이고 수 분 내 만료됩니다. 처음부터 다시 시도하세요' : undefined,
    )
  }
  return body.refresh_token
}

/** 로컬 PC 용 — 브라우저가 열리는 환경에서 한 번에 끝낸다 */
async function cmdAuth() {
  const { verifier, challenge } = pkce()
  const url = authUrl(challenge)
  console.log('\n아래 URL 을 브라우저에서 열어 스크립트 소유 계정으로 승인하세요:\n')
  console.log(`  ${url}\n`)
  console.log(`(승인 후 ${REDIRECT_URI} 로 돌아옵니다. 이 창은 열어 두세요)\n`)

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const got = new URL(req.url, REDIRECT_URI).searchParams.get('code')
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(got ? '<h3>완료했습니다. 터미널로 돌아가세요.</h3>' : '<h3>code 를 받지 못했습니다.</h3>')
      server.close()
      got ? resolve(got) : reject(new Error('code 없음'))
    })
    server.listen(REDIRECT_PORT)
    setTimeout(() => {
      server.close()
      reject(new Error('시간 초과 (5분)'))
    }, 300_000)
  })

  const refresh = await exchange(code, verifier)
  console.log('\n리프레시 토큰 — 이 값은 비밀입니다. 채팅·이슈·커밋에 붙여넣지 마세요.\n')
  console.log(`  ${refresh}\n`)
  console.log('GitHub → Settings → Secrets and variables → Actions → GAS_REFRESH_TOKEN 에 등록하세요.')
}

/** 헤드리스(원격 컨테이너) 용 — URL 만 출력하고, 코드는 다음 명령으로 받는다 */
function cmdAuthUrl() {
  const { verifier, challenge } = pkce()
  fs.writeFileSync(PKCE_STATE_PATH, JSON.stringify({ verifier }), { mode: 0o600 })
  console.log('\n① 아래 URL 을 브라우저에서 열어 승인하세요:\n')
  console.log(`  ${authUrl(challenge)}\n`)
  console.log(`② 브라우저가 ${REDIRECT_URI}/?code=... 로 이동하며 "연결할 수 없음"이 뜹니다 (정상).`)
  console.log('   주소창의 code= 뒤 값을 복사해 다음을 실행하세요:\n')
  console.log('     node scripts/gas-sync.mjs auth-exchange <코드>\n')
  console.log(`⚠ 두 단계는 같은 세션에서 해야 합니다 (검증값이 ${PKCE_STATE_PATH} 에 있습니다)`)
}

async function cmdAuthExchange() {
  const code = argv[1]
  if (!code) fail('코드를 주세요', 'node scripts/gas-sync.mjs auth-exchange 4/0Ab...')
  if (!fs.existsSync(PKCE_STATE_PATH)) fail('검증값이 없습니다', '먼저 auth-url 을 같은 세션에서 실행하세요')
  const { verifier } = JSON.parse(fs.readFileSync(PKCE_STATE_PATH, 'utf8'))
  const refresh = await exchange(decodeURIComponent(code), verifier)
  fs.rmSync(PKCE_STATE_PATH, { force: true })
  const out = path.join(os.tmpdir(), 'gas-refresh-token.txt')
  fs.writeFileSync(out, refresh, { mode: 0o600 })
  console.log(`\n✔ 리프레시 토큰을 ${out} 에 저장했습니다 (길이 ${refresh.length}, 앞 6자 ${refresh.slice(0, 6)}…)`)
  console.log('  전체 값은 출력하지 않았습니다 — 대화 기록에 비밀값을 남기지 않기 위해서입니다.')
  console.log('  GitHub Secrets 에 등록할 값이 필요하면 그 파일을 직접 여세요.')
}

// ── 진입점 ──────────────────────────────────────────────────
const COMMANDS = {
  status: cmdStatus,
  check: cmdCheck,
  pull: cmdPull,
  push: cmdPush,
  deploy: cmdDeploy,
  rollback: cmdRollback,
  auth: cmdAuth,
  'auth-url': async () => cmdAuthUrl(),
  'auth-exchange': cmdAuthExchange,
}

const run = COMMANDS[command]
if (!run) {
  console.error('사용법: node scripts/gas-sync.mjs <status|check|pull|push|deploy|rollback|auth|auth-url|auth-exchange>')
  console.error('자세한 설명은 docs/gas-automation.md')
  process.exit(1)
}

run().catch((e) => {
  console.error(`\n✖ ${e.stack ?? e.message}`)
  process.exit(1)
})

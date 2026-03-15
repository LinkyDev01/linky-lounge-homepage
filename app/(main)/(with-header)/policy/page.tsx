"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"

type PolicyType = "study" | "wine" | "night" | "bookclub"

function PolicyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const typeParam = searchParams.get("type")
  const activeTab: PolicyType = typeParam === "wine" ? "wine" : typeParam === "night" ? "night" : typeParam === "bookclub" ? "bookclub" : "study"

  const handleTabChange = (type: PolicyType) => {
    router.push(`/policy?type=${type}`)
  }

  return (
    <main className="bg-background">
      <div className="h-20 bg-foreground" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 break-keep">
        <h1 className="text-3xl font-bold mb-8 mt-8">참가 및 환불 안내</h1>

        {/* Tab Navigation */}
        <div className="flex border-b border-foreground/20 mb-8">
          <button
            onClick={() => handleTabChange("study")}
            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === "study"
              ? "text-[#9CB7A4]"
              : "text-foreground/60 hover:text-foreground/80"
              }`}
          >
            회화스터디
            {activeTab === "study" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9CB7A4]" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("wine")}
            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === "wine"
              ? "text-[#9CB7A4]"
              : "text-foreground/60 hover:text-foreground/80"
              }`}
          >
            게더링·모임
            {activeTab === "wine" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9CB7A4]" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("night")}
            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === "night"
              ? "text-[#9CB7A4]"
              : "text-foreground/60 hover:text-foreground/80"
              }`}
          >
            몰입의 밤
            {activeTab === "night" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9CB7A4]" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("bookclub")}
            className={`px-6 py-3 font-medium transition-colors relative ${activeTab === "bookclub"
              ? "text-[#9CB7A4]"
              : "text-foreground/60 hover:text-foreground/80"
              }`}
          >
            북클럽
            {activeTab === "bookclub" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9CB7A4]" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === "study" && <StudyPolicy />}
        {activeTab === "wine" && <WinePolicy />}
        {activeTab === "night" && <NightPolicy />}
        {activeTab === "bookclub" && <BookClubPolicy />}
      </div>
    </main>
  )
}

function StudyPolicy() {
  return (
    <>
      {/* 신청 및 참가 안내 */}
      <h2 className="text-2xl font-bold mb-6 text-[#9CB7A4]">신청 및 참가 안내</h2>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">1. 신청 접수</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>신청 마감:</strong> 모임 시작 전월 말일까지 (예: 2월 모임은 1월 31일 마감)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>참가 확정:</strong> 신청 순이 아닌, 입금 완료 순으로 참가가 확정됩니다
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>조기 마감:</strong> 정원 충족 시 마감일 이전에도 조기 마감될 수 있습니다
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>최소 인원:</strong> 반 구성 최소 인원은 3명이며, 미달 시 모임이 취소되고 전액 환불됩니다
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">2. 참가 확정 및 안내</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>입금 확인 후 문자메시지로 참가 확정을 개별 안내해드립니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>반 확정 시 카카오톡 단체방을 개설하여 상세 일정과 공지사항을 안내합니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>모임 일정 변경 시 문자메시지로 사전 안내드립니다</span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">3. 향후 운영 예정</h3>
        <div className="bg-foreground/5 rounded-lg p-6">
          <ul className="space-y-2 text-foreground/80">
            <li>
              <strong>2월:</strong> 입문반 1기-1
            </li>
            <li>
              <strong>3월:</strong> 입문반 1기-2, 초급반 1기-1
            </li>
            <li>
              <strong>4월:</strong> 입문반 2기-1, 초급반 2기-2
            </li>
            <li>
              <strong>5월:</strong> 초급반 2기-3, 입문반 2기-2
            </li>
          </ul>
          <p className="text-sm text-foreground/60 mt-4">
            ※ 상기 일정은 운영 상황에 따라 변경될 수 있습니다
          </p>
        </div>
      </section>

      {/* 교환/환불 안내 */}
      <h2 className="text-2xl font-bold mb-6 mt-12 text-[#9CB7A4]">환불 안내</h2>

      <p className="text-foreground/80 mb-8">
        링키라운지는 참여자분들이 실제 모임을 경험해보신 후 안심하고 결정하실 수 있도록 환불 정책을 운영하고 있습니다.
      </p>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">1. 환불 가능 기준</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>첫 번째 모임 시작 1주일 전까지:</strong> 전액 환불 (100%)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>첫 번째 모임 참여 후 중단 시:</strong> 미참여 회차 금액 환불
            </span>
          </li>
          <li className="flex gap-2 ml-6">
            <span className="text-foreground/60">└</span>
            <span className="text-foreground/60">
              예시: 4회 구성 스터디에서 1회 참여 후 중단 시, 남은 3회 분량(75%) 환불
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">2. 환불 시 유의사항</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>환불은 스터디를 완전히 중단하시는 경우에만 가능합니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>일부 회차만 선택적으로 불참하시는 것은 환불 사유가 되지 않습니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>불참 시에도 별도 환불은 제공되지 않습니다</span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">3. 환불 불가 시점</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              링키라운지 회화 스터디는 매 회차 주제와 진행 방식을 사전에 기획하고 준비합니다
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>2회차 모임 참여 이후에는 환불이 불가능</strong>한 점 미리 안내드립니다
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">4. 환불 신청 방법</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              환불 신청은 등록하신 연락처로 문자 또는 카카오톡 메시지를 통해 접수 가능합니다
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>환불 신청 후 영업일 기준 3~5일 내 처리됩니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>환불 수수료는 없으며, 결제 금액에서 참여 회차만큼 차감 후 환불됩니다</span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">5. 모임 미개설 시</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>최소 인원(3명) 미달로 모임이 취소되는 경우 전액 환불됩니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>환불은 모임 예정일 전일까지 안내 및 처리됩니다</span>
          </li>
        </ul>
      </section>
    </>
  )
}

function WinePolicy() {
  return (
    <>
      {/* 신청 및 참가 안내 */}
      <h2 className="text-2xl font-bold mb-6 text-[#9CB7A4]">신청 및 참가 안내</h2>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">1. 신청 접수</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>신청 마감:</strong> 모임일로부터 2일 전까지
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>참가 확정:</strong> 신청 순이 아닌, 입금 완료 순으로 참가가 확정됩니다
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>조기 마감:</strong> 정원 충족 시 마감일 이전에도 조기 마감될 수 있습니다
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>최소 인원:</strong> 모임 구성 최소 인원은 8명이며, 미달 시 모임이 취소되고 전액 환불됩니다
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">2. 참가 확정 및 안내</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>입금 확인 후 문자메시지로 참가 확정을 개별 안내해드립니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>참가 확정 시 카카오톡 단체방을 개설하여 상세 일정과 공지사항을 안내합니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>모임 일정 변경 시 문자메시지로 사전 안내드립니다</span>
          </li>
        </ul>
      </section>

      {/* 교환/환불 안내 */}
      <h2 className="text-2xl font-bold mb-6 mt-12 text-[#9CB7A4]">환불 안내</h2>

      <p className="text-foreground/80 mb-8">
        링키라운지는 참여자분들이 안심하고 신청하실 수 있도록 합리적인 환불 정책을 운영하고 있습니다.
      </p>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">1. 환불 가능 기준</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>모임 시작 3일 전까지:</strong> 전액 환불 (100%)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>모임 시작 2일 전:</strong> 50% 환불
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>
              <strong>모임 시작 전날 이후:</strong> 환불 불가
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">2. 환불 시 유의사항</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>환불 신청 시점 기준으로 환불률이 적용됩니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>개인 사정으로 인한 불참 시에도 동일한 기준이 적용됩니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>천재지변 등 불가항력적 사유로 모임이 취소되는 경우 전액 환불됩니다</span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">3. 환불 신청 방법</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>환불 신청은 등록하신 연락처로 문자 또는 카카오톡 메시지를 통해 접수 가능합니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>환불 신청 후 영업일 기준 3~5일 내 처리되며, 환불 기준에 따라 산정된 금액이 지급됩니다</span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">4. 모임 미개설 시</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>최소 인원(8명) 미달로 모임이 취소되는 경우 전액 환불됩니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>환불은 모임 예정일 전일까지 안내 및 처리됩니다</span>
          </li>
        </ul>
      </section>
    </>
  )
}

function NightPolicy() {
  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-[#9CB7A4]">신청 및 참가 안내</h2>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">1. 신청 접수</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span><strong>신청 마감:</strong> 모임일로부터 2일 전까지</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span><strong>참가 확정:</strong> 입금 완료 순으로 참가가 확정됩니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span><strong>조기 마감:</strong> 정원 충족 시 조기 마감될 수 있습니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span><strong>최소 인원:</strong> 3명 미달 시 모임 취소 및 전액 환불</span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">2. 참가 확정 및 안내</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>입금 확인 후 문자메시지로 참가 확정을 안내드립니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>카카오톡 단체방을 통해 상세 일정과 공지를 안내합니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>일정 변경 시 사전 안내드립니다</span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">3. 사전 안내</h3>
        <div className="bg-foreground/5 rounded-lg p-6 space-y-2 text-foreground/80">
          <p>• 몰입의 밤은 조용하고 집중된 분위기에서 각자의 활동에 몰입하는 시간입니다</p>
          <p>• 소규모 정원으로 운영되어 편안하고 친밀한 환경을 제공합니다</p>
          <p>• 개인 작업물(노트북, 책, 태블릿 등) 지참을 권장합니다</p>
        </div>
      </section>

      <h2 className="text-2xl font-bold mb-6 mt-12 text-[#9CB7A4]">환불 안내</h2>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">1. 환불 가능 기준</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>모임 시작 3일 전까지: 전액 환불 (100%)</span></li>
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>모임 시작 2일 전: 50% 환불</span></li>
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>모임 시작 전날 이후: 환불 불가</span></li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">2. 환불 시 유의사항</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>환불 신청 시점 기준으로 환불률이 적용됩니다</span></li>
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>개인 사정으로 인한 불참도 동일 기준이 적용됩니다</span></li>
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>불가항력 사유로 취소 시 전액 환불됩니다</span></li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">3. 환불 신청 방법</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>문자 또는 카카오톡으로 접수 가능합니다</span></li>
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>영업일 기준 3~5일 내 처리됩니다</span></li>
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>환불 수수료는 없습니다</span></li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">4. 모임 미개설 시</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>최소 인원(3명) 미달 시 전액 환불됩니다</span></li>
          <li className="flex gap-2"><span className="text-[#9CB7A4]">•</span><span>모임 예정일 전일까지 안내 및 처리됩니다</span></li>
        </ul>
      </section>
    </>
  )
}


function BookClubPolicy() {
  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-[#9CB7A4]">신청 및 참가 안내</h2>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">1. 신청 접수</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span><strong>신청 방법:</strong> 신청 폼 작성 후 인터뷰를 통해 참가 여부가 결정됩니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span><strong>참가 확정:</strong> 인터뷰 진행 후 희망 일정을 고려하여 반 배정을 진행합니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span><strong>조기 마감:</strong> 정원 충족 시 마감일 이전에도 조기 마감될 수 있습니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span><strong>최소 인원:</strong> 반 구성 최소 인원 미달 시 모임이 취소되고 전액 환불됩니다</span>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-[#9CB7A4]">2. 참가 확정 및 안내</h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>입금 확인 후 문자메시지로 참가 확정을 개별 안내해드립니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>반 확정 시 카카오톡 단체방을 개설하여 상세 일정과 공지사항을 안내합니다</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>모임 일정 변경 시 문자메시지로 사전 안내드립니다</span>
          </li>
        </ul>
      </section>

      <h2 className="text-2xl font-bold mb-6 mt-12 text-[#9CB7A4]">환불 안내</h2>

      <section className="mb-10">
        <ul className="space-y-3 text-foreground/80">
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>첫 모임 시작일로부터 1주 전까지 전액 환불</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>1회 참여 후 중단 시 미참여 회차 환불</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span><strong>2회차 이후 환불 불가</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="text-[#9CB7A4]">•</span>
            <span>최소 인원 미달 시 전액 환불</span>
          </li>
        </ul>
      </section>
    </>
  )
}


export default function PolicyPage() {
  return (
    <Suspense fallback={
      <main className="bg-background">
        <div className="h-20 bg-black/80" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 break-keep">
          <h1 className="text-3xl font-bold mb-8 mt-8">환불 안내</h1>
          <div className="animate-pulse">
            <div className="h-10 bg-foreground/10 rounded mb-8" />
            <div className="space-y-4">
              <div className="h-4 bg-foreground/10 rounded w-3/4" />
              <div className="h-4 bg-foreground/10 rounded w-1/2" />
            </div>
          </div>
        </div>
      </main>
    }>
      <PolicyContent />
    </Suspense>
  )
}

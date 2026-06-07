<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="policy">
    <button class="policy__back" @click="router.back()">← 돌아가기</button>
    <h1 class="policy__title">개인정보 처리방침</h1>
    <p class="policy__updated">최종 개정일: 2026년 6월 7일</p>

    <section class="policy__section">
      <h2>수집하는 정보</h2>
      <ul>
        <li>이메일 주소 (회원가입 시)</li>
        <li>사용자 닉네임 (프로필)</li>
        <li>작성한 리뷰·사진 콘텐츠</li>
        <li>로그인·접속 기록 (서비스 운영 목적)</li>
      </ul>
    </section>

    <section class="policy__section">
      <h2>수집 목적</h2>
      <ul>
        <li>회원 식별 및 인증</li>
        <li>리뷰 작성·공유 기능 제공</li>
        <li>서비스 개선 및 오류 추적</li>
      </ul>
    </section>

    <section class="policy__section">
      <h2>보관 및 파기</h2>
      <p>
        회원 탈퇴 시 작성한 리뷰·사진을 포함한 모든 정보는 즉시 파기됩니다. 단,
        법령상 의무 보관이 요구되는 정보는 해당 기간 동안 보관됩니다.
      </p>
    </section>

    <section class="policy__section">
      <h2>제3자 제공</h2>
      <p>
        회원의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 서비스
        제공업체와 데이터 처리를 위해 정보를 위탁합니다.
      </p>
      <ul>
        <li>Supabase (데이터베이스·인증·스토리지)</li>
        <li>Vercel (서비스 호스팅)</li>
        <li>Kakao (카카오톡 공유)</li>
      </ul>
    </section>

    <section class="policy__section">
      <h2>회원의 권리</h2>
      <p>
        회원은 언제든지 본인의 개인정보를 열람·수정·삭제할 수 있으며, 회원 탈퇴를
        요청할 수 있습니다.
      </p>
    </section>

    <p class="policy__note">
      ※ 본 처리방침은 베타 운영을 위한 최소 형식이며, 정식 출시 시 갱신됩니다.
      문의: 1nnsuu12.dev@gmail.com
    </p>
  </div>
</template>

<style scoped>
.policy {
  max-width: 640px;
  margin: 0 auto;
}

.policy__back {
  background: none;
  border: none;
  color: var(--ink-500);
  padding: 4px 0;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 16px;
}

.policy__back:hover {
  color: var(--ink-1000);
}

.policy__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-1000);
}

.policy__updated {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-500);
  letter-spacing: 0.04em;
}

.policy__section {
  margin-top: 28px;
}

.policy__section h2 {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink-1000);
  margin-bottom: 8px;
}

.policy__section p,
.policy__section li {
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-700);
}

.policy__section ul {
  padding-left: 20px;
}

.policy__note {
  margin-top: 32px;
  padding: 12px 14px;
  background: var(--ink-50);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--ink-500);
}
</style>

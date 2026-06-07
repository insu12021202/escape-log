<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="policy">
    <button class="policy__back" @click="router.back()">← 돌아가기</button>
    <h1 class="policy__title">이용약관</h1>
    <p class="policy__updated">최종 개정일: 2026년 6월 7일</p>

    <section class="policy__section">
      <h2>제1조 (목적)</h2>
      <p>
        본 약관은 방탈출 리뷰 기록장(이하 "서비스")의 이용과 관련하여 회원과 운영자
        사이의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
      </p>
    </section>

    <section class="policy__section">
      <h2>제2조 (서비스의 성격)</h2>
      <p>
        본 서비스는 v1 비공식 베타로 제공되며, 회원 간의 방탈출 기록 공유를 목적으로
        합니다. 운영자는 서비스의 안정성·정확성을 보장하지 않으며, 이용 중단·데이터
        손실에 대해 책임지지 않습니다.
      </p>
    </section>

    <section class="policy__section">
      <h2>제3조 (회원의 의무)</h2>
      <ul>
        <li>타인의 명예를 훼손하거나 권리를 침해하는 게시물을 작성하지 않을 것</li>
        <li>저작권을 침해하는 이미지를 업로드하지 않을 것</li>
        <li>스팸·광고성 콘텐츠를 게시하지 않을 것</li>
      </ul>
    </section>

    <section class="policy__section">
      <h2>제4조 (게시물의 관리)</h2>
      <p>
        회원이 작성한 게시물의 저작권은 회원에게 있으며, 운영자는 약관 위반 시
        게시물을 삭제할 수 있습니다.
      </p>
    </section>

    <p class="policy__note">
      ※ 본 약관은 베타 운영을 위한 최소 형식이며, 정식 출시 시 갱신됩니다.
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

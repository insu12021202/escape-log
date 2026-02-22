<template>
  <div class="spinner" role="status" aria-label="불러오는 중">
    <div class="spinner__circle" />
  </div>
</template>

<style scoped>
.spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.spinner__circle {
  width: 32px;
  height: 32px;
  border: 3px solid #eee;
  border-top-color: #4a90d9;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

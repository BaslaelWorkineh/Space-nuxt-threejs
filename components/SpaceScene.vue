<template>
    <div ref="containerRef" class="space-container">

    </div>
  </template>
  
  <script setup lang="ts">
  const { containerRef } = useSpaceScene()
  </script>
  
  <style scoped>
  .space-container {
    width: 100%;
    height: 100vh;
    display: block;
    position: relative;
    background: #000;
  }
  
  </style>
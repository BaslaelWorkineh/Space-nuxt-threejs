<template>
    <div ref="containerRef" class="space-container">
      <div class="overlay">
        <h1>Space Explorer</h1>
        <p>Journey through the cosmos</p>
      </div>
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
  
  .overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: white;
    pointer-events: none;
    z-index: 1;
  }
  
  h1 {
    font-size: 4rem;
    margin: 0;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    font-weight: 700;
    letter-spacing: 2px;
  }
  
  p {
    font-size: 1.5rem;
    margin-top: 1rem;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    opacity: 0.8;
  }
  </style>
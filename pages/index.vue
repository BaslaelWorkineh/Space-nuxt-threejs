<template>
    <div ref="containerRef" class="space-container">
      <!-- Toggle Info Panel Button -->
      <button class="toggle-button" @click="toggleInfoPanel">
        {{ showInfoPanel ? "Hide Info" : "Show Info" }}
      </button>
  
      <!-- Play Space Game Button -->
      <button class="toggle-button2" @click="playGame">
        Space Game
      </button>
  
      <!-- GitHub Link -->
      <a href="https://github.com/BaslaelWorkineh" target="_blank" rel="noopener noreferrer" class="github-link">
        <svg class="github-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" 
            fill="#ffcc00"/>
        </svg>
      </a>
  
      <!-- Information Panel -->
      <div v-if="nasaData && showInfoPanel" class="info-panel">
        <div class="image-wrapper">
          <img :src="nasaData.url" alt="NASA APOD" class="apod-image" v-if="isImage(nasaData.url)" />
        </div>
        <div class="info-content">
          <h1>{{ nasaData.title }}</h1>
          <p class="date">{{ nasaData.date }}</p>
          <p class="explanation">{{ nasaData.explanation }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { useRouter } from 'vue-router';
  
  // Space Scene Reference
  const { containerRef } = useSpaceScene();
  
  // NASA Data State
  const nasaData = ref<{
    title: string;
    explanation: string;
    url: string;
    date: string;
  } | null>(null);
  
  // UI States
  const showInfoPanel = ref(false);
  
  // Toggle Info Panel Visibility
  const toggleInfoPanel = () => {
    showInfoPanel.value = !showInfoPanel.value;
  };
  
  const router = useRouter();

const playGame = () => {
  router.push('/game'); // This navigates to the game page
};
  // Helper to Check if URL is an Image
  const isImage = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/.test(url);
  };
  
  // Fetch NASA APOD Data
  onMounted(async () => {
    const apiKey = "NaGbRJ8hNaQHW9975uDd739PFb89aGs6ntgZzsk9"; // Replace with your NASA API key
    const response = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`
    );
    const data = await response.json();
    nasaData.value = data;
  });
  </script>
  
  <style scoped>
  .space-container {
    width: 100%;
    height: 100vh;
    position: relative;
    background: #000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .toggle-button,
  .action-button {
    position: absolute;
    left: 20px;
    background: #ffcc00;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    z-index: 10;
    text-decoration: none;
    color: #000;
    top:10px;
    width: 120px
  }
  .toggle-button2{
    position: absolute;
    left: 20px;
    top:50px;
    background: #e1ff00;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    z-index: 10;
    text-decoration: none;
    color: #000;
    width: 120px
  }
  
  .github-link {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
    transition: transform 0.2s ease;
  }
  
  .github-link:hover {
    transform: scale(1.1);
  }
  
  .github-icon {
    width: 32px;
    height: 32px;
  }
  
  .info-panel {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: #fff;
    padding: 20px;
    border-radius: 10px;
    max-width: 90%;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
    z-index: 5;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .image-wrapper {
    max-height: 200px;
    overflow: hidden;
    border-radius: 10px;
  }
  
  .apod-image {
    width: 100%;
    height: auto;
    object-fit: contain;
  }
  
  .info-content h1 {
    font-size: 1.5rem;
    margin: 0;
    color: #ffcc00;
  }
  
  .info-content .date {
    font-size: 0.9rem;
    font-weight: bold;
    color: #ffd700;
    margin-bottom: 10px;
  }
  
  .info-content .explanation {
    font-size: 1rem;
    line-height: 1.5;
  }
  
  @media screen and (max-width: 768px) {
    .info-panel {
      bottom: 10px;
      left: 10px;
      padding: 15px;
      max-width: 95%;
    }
  
    .info-content h1 {
      font-size: 1.2rem;
    }
  
    .info-content .explanation {
      font-size: 0.9rem;
    }
  
    .github-link {
      top: 10px;
      right: 10px;
    }
  
    .github-icon {
      width: 28px;
      height: 28px;
    }
  }
  </style>
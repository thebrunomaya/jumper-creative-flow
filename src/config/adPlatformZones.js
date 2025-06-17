
export const adPlatformZones = {
  meta: {
    stories: {
      name: "Instagram Stories",
      description: "Imagens verticais para Stories",
      aspectRatio: "9:16",
      contentTypes: ["image", "jpeg", "jpg", "png"],
      zones: {
        topSafeMargin: 14,        // Top 14% for Stories header
        leftSafeMargin: 6,        // Left 6% safe margin
        rightSafeMargin: 6,       // Right 6% safe margin
        bottomSafeMargin: 20      // Bottom 20% for Stories UI
      },
      warningMessage: "Evite colocar textos ou logos importantes nas zonas vermelhas: topo 14%, laterais 6% e base 20%."
    },
    reels: {
      name: "Instagram Reels",
      description: "Vídeos verticais",
      aspectRatio: "9:16", 
      contentTypes: ["video", "mp4", "mov", "avi", "webm"],
      zones: {
        topSafeMargin: 14,        // Top 14% for Reels header
        leftSafeMargin: 6,        // Left 6% safe margin
        rightSafeMargin: 6,       // Right 6% safe margin
        lowerRightZone: {
          zoneHeight: 40,         // Lower right zone is 40% of total height
          safeMargin: 21          // Within that zone, keep 21% margin from right
        },
        bottomSafeMargin: 35      // Bottom 35% for navigation
      },
      warningMessage: "Não posicione elementos importantes fora da zona segura: topo 14%, esquerda/direita 6%, na zona direita inferior (altura 40%) deixe 21% livres e na base 35%."
    }
  }
};

// Helper function to detect content type and return appropriate zone config
export const getZoneConfig = (file) => {
  if (!file) return null;
  
  const isVideo = file.type?.startsWith('video/') || 
                  ['mp4', 'mov', 'avi', 'webm'].some(ext => 
                    file.name?.toLowerCase().endsWith(`.${ext}`)
                  );
  
  return isVideo ? adPlatformZones.meta.reels : adPlatformZones.meta.stories;
};

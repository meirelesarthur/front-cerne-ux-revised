export const Text = {
  baseStyle: {},
  variants: {
    shiny: {
      background: "linear-gradient(to right, #333 20%, #eee 50%, #333 80%)",
      backgroundSize: "200% auto",
      color: "transparent",
      "-webkit-background-clip": "text",
      backgroundClip: "text",
      animation: "shiny-text-anim 2s linear infinite",
    },
    gradient: {
      // Usamos um gradiente padrão aqui. Ele pode ser customizado depois.
      backgroundImage: "linear-gradient(90deg, #40ffaa, #4079ff, #40ffaa)",
      backgroundSize: "300% 100%",
      backgroundClip: "text",
      "-webkit-background-clip": "text",
      color: "transparent",
      // Usa a animação 'gradient' que já definimos no seu tema
      animation: `gradient 8s linear infinite`,
    },
  },
};

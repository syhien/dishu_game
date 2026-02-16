// 游戏配置 - 从环境变量读取

export const config = {
  // 应用信息
  appName: import.meta.env.VITE_APP_NAME || '嘀咕游戏',
  appSubtitle: import.meta.env.VITE_APP_SUBTITLE || '在线多人游戏平台',
  appLogo: import.meta.env.VITE_APP_LOGO || '🎮',
  
  // 主题色
  theme: {
    primary: import.meta.env.VITE_THEME_PRIMARY || '#667eea',
    secondary: import.meta.env.VITE_THEME_SECONDARY || '#764ba2',
    gradient: `linear-gradient(135deg, ${import.meta.env.VITE_THEME_PRIMARY || '#667eea'} 0%, ${import.meta.env.VITE_THEME_SECONDARY || '#764ba2'} 100%)`,
  },
  
  // 调试模式
  debug: import.meta.env.VITE_DEBUG === 'true',
} as const;

// 为了兼容 string 类型的渐变
export const themeGradient = config.theme.gradient;

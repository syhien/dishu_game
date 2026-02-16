# 构建阶段
FROM node:20-alpine AS builder

# 构建参数
ARG VITE_APP_NAME
ARG VITE_APP_SUBTITLE
ARG VITE_APP_LOGO
ARG VITE_THEME_PRIMARY
ARG VITE_THEME_SECONDARY

# 设置为环境变量供构建使用
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_SUBTITLE=${VITE_APP_SUBTITLE}
ENV VITE_APP_LOGO=${VITE_APP_LOGO}
ENV VITE_THEME_PRIMARY=${VITE_THEME_PRIMARY}
ENV VITE_THEME_SECONDARY=${VITE_THEME_SECONDARY}

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

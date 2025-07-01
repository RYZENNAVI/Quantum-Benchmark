# 使用Node.js作为基础镜像
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 暴露端口
EXPOSE 5185

# 启动开发服务器
CMD ["npm", "run", "dev", "--", "--host"] 
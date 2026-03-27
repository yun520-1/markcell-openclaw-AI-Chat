#!/bin/bash
# OpenClaw 外网服务监控脚本
# 
# 用法：bash monitor-wan-service.sh [IP] [PORT]

TARGET_IP=${1:-"49.87.224.177"}
TARGET_PORT=${2:-"1238"}
TARGET_CODE="OCLAW-CECB-2C97-44F3"

echo "========================================"
echo "🌐 OpenClaw 外网服务监控"
echo "========================================"
echo ""
echo "📍 目标 IP: ${TARGET_IP}"
echo "📍 目标端口：${TARGET_PORT}"
echo "📍 目标编码：${TARGET_CODE}"
echo ""
echo "⏱️  开始监控... (按 Ctrl+C 停止)"
echo ""

# 监控循环
while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  
  # 测试连接
  START_TIME=$(date +%s%N)
  curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 \
    "http://${TARGET_IP}:${TARGET_PORT}/status" > /tmp/wan_status.txt 2>&1
  HTTP_CODE=$?
  END_TIME=$(date +%s%N)
  
  # 计算延迟
  ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))
  
  # 显示状态
  if [ $HTTP_CODE -eq 0 ]; then
    echo "✅ [${TIMESTAMP}] 服务在线 | 延迟：${ELAPSED_MS}ms | HTTP: 200"
  else
    echo "❌ [${TIMESTAMP}] 服务离线 | 连接失败 | HTTP: ${HTTP_CODE}"
  fi
  
  # 每 5 秒检查一次
  sleep 5
done

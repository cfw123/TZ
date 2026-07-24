<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)

const navItems = [
  { name: 'xzyjjm', path: '/xzyjjm', label: '细渣提精煤卸输煤台账' },
  { name: 'ylyjm', path: '/ylyjm', label: '原料煤卸输煤台账' },
  { name: 'ghwng', path: '/ghwng', label: '干化污泥卸输煤台账' },
  { name: 'rlm', path: '/rlm', label: '燃料煤卸输煤台账' },
]

function isActive(path) {
  return route.path === path
}
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="sidebar-header">
        <span v-if="!collapsed" class="sidebar-title">原运装置</span>
        <button class="collapse-btn" @click="collapsed = !collapsed">
          {{ collapsed ? '展开' : '收起' }}
        </button>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon">{{ isActive(item.path) ? '●' : '○' }}</span>
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Microsoft YaHei', '微软雅黑', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: #333;
  background: #f0f2f5;
}

a {
  text-decoration: none;
  color: inherit;
}
</style>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: #1a2a40;
  color: #fff;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  min-height: 56px;
}

.sidebar-title {
  font-size: 15px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  color: #7eb8e8;
}

.collapse-btn {
  background: none;
  border: 1px solid rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.7);
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px;
  white-space: nowrap;
  font-family: inherit;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  color: rgba(255,255,255,0.75);
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.nav-item.active {
  background: rgba(74, 122, 181, 0.3);
  color: #fff;
  border-left-color: #4a7ab5;
}

.nav-icon {
  font-size: 10px;
  flex-shrink: 0;
  width: 14px;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>

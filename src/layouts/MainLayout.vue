<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> Maps </q-toolbar-title>
        <q-btn
          flat
          round
          :aria-label="`Switch to ${themeMode === 'light' ? 'dark' : 'light'} theme`"
          :icon="themeMode === 'light' ? 'dark_mode' : 'light_mode'"
          @click="toggleTheme"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { themeMode, toggleTheme } from "@/config/theme";
</script>

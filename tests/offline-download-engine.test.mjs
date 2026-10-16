import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { formatBytes } from '../src/offline/downloadEngine.js'
import { CURRENT_APP_VERSION, GITHUB_REPO, LATEST_APK_URL } from '../src/offline/appUpdater.js'

const libraryPage = fs.readFileSync(new URL('../src/components/LibraryPage.jsx', import.meta.url), 'utf8')
const animeDetail = fs.readFileSync(new URL('../src/components/AnimeDetail.jsx', import.meta.url), 'utf8')
const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const workflow = fs.readFileSync(new URL('../.github/workflows/build-apk.yml', import.meta.url), 'utf8')
const capConfig = fs.readFileSync(new URL('../capacitor.config.json', import.meta.url), 'utf8')

test('formats bytes correctly into human readable units', () => {
  assert.equal(formatBytes(0), '0 MB')
  assert.equal(formatBytes(1024), '1 KB')
  assert.equal(formatBytes(1048576), '1 MB')
  assert.equal(formatBytes(157286400), '150 MB')
  assert.equal(formatBytes(1073741824), '1 GB')
})

test('app updater configuration is properly defined', () => {
  assert.equal(CURRENT_APP_VERSION, '1.0.0')
  assert.equal(GITHUB_REPO, 'AndrehhX/orunei-v2')
  assert.match(LATEST_APK_URL, /orunei\.apk$/)
})

test('library page includes Descargas filter and offline storage controls', () => {
  assert.match(libraryPage, /\['downloads', 'Descargas'\]/)
  assert.match(libraryPage, /getAllDownloads/)
  assert.match(libraryPage, /OfflinePlayerModal/)
  assert.match(libraryPage, /Liberar espacio \(Borrar todo\)/)
  assert.match(libraryPage, /Reproducir offline/)
})

test('anime detail includes episode download controls and offline indicators', () => {
  assert.match(animeDetail, /startEpisodeDownload/)
  assert.match(animeDetail, /handleDownload/)
  assert.match(animeDetail, /Descargar para ver sin internet/)
  assert.match(animeDetail, /CheckCircle2/)
})

test('app header and sidebar include Android APK download actions', () => {
  assert.match(app, /onOpenDownloadApp/)
  assert.match(app, /DownloadAppModal/)
  assert.match(app, /UpdateModal/)
  assert.match(app, /checkForUpdate/)
})

test('capacitor config and android workflow are properly set up', () => {
  const config = JSON.parse(capConfig)
  assert.equal(config.appId, 'com.orunei.app')
  assert.equal(config.appName, 'Orunei')
  assert.equal(config.webDir, 'dist')

  assert.match(workflow, /permissions:\s+contents:\s+write/)
  assert.match(workflow, /assembleRelease/)
  assert.match(workflow, /orunei\.apk/)
  assert.match(workflow, /softprops\/action-gh-release/)
})

// Orunei App Auto-Updater
// Detecta cuando hay una nueva versión del APK en el repositorio de GitHub y notifica al usuario

export const CURRENT_APP_VERSION = '1.0.0';
export const GITHUB_REPO = 'AndrehhX/orunei-v2';
export const LATEST_APK_URL = 'https://github.com/AndrehhX/orunei-v2/releases/download/latest/orunei.apk';

export async function checkForUpdate() {
  try {
    // Intentar consultar la API de GitHub Releases
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (res.ok) {
      const data = await res.json();
      const tagName = data.tag_name ? data.tag_name.replace(/^v/, '') : '';
      const apkAsset = data.assets?.find((a) => a.name.endsWith('.apk'));
      const downloadUrl = apkAsset?.browser_download_url || LATEST_APK_URL;

      const hasUpdate = tagName && isVersionGreater(tagName, CURRENT_APP_VERSION);
      return {
        hasUpdate,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: tagName || CURRENT_APP_VERSION,
        releaseNotes: data.body || 'Nuevas mejoras y correcciones de estabilidad.',
        downloadUrl,
        publishedAt: data.published_at,
      };
    }
  } catch {
    // Si falla GitHub (red u offline), intentar fallback local /version.json
  }

  try {
    const localRes = await fetch('/version.json');
    if (localRes.ok) {
      const localData = await localRes.json();
      const hasUpdate = isVersionGreater(localData.version, CURRENT_APP_VERSION);
      return {
        hasUpdate,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: localData.version,
        releaseNotes: localData.notes || 'Actualización de Orunei',
        downloadUrl: localData.apkUrl || LATEST_APK_URL,
      };
    }
  } catch {}

  return { hasUpdate: false, currentVersion: CURRENT_APP_VERSION, downloadUrl: LATEST_APK_URL };
}

function isVersionGreater(v1, v2) {
  const parts1 = String(v1).split('.').map(Number);
  const parts2 = String(v2).split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return true;
    if (num1 < num2) return false;
  }
  return false;
}

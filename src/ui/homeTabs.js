const baseClass = 'relative rounded-full px-4 py-1.5 transition-colors duration-200'

export function getHomeTabClass(tab, activeTab) {
  return `${baseClass} ${tab === activeTab ? 'bg-brand text-white shadow-md shadow-brand/30' : 'text-slate-600 dark:text-slate-300 hover:text-brand'}`
}

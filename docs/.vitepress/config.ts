import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import fs from 'node:fs'
import path from 'node:path'

// Auto-generate sidebar items from a directory
function getSidebarItems(dir: string) {
  const fullPath = path.join(__dirname, '..', dir)
  if (!fs.existsSync(fullPath)) {
    return []
  }

  return fs
    .readdirSync(fullPath)
    .filter((file) => file.endsWith('.md') && file !== 'index.md')
    .map((file) => {
      const name = path.basename(file, '.md')
      // Convert kebab-case to Title Case
      const text = name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      return { text, link: `/${dir}/${name}` }
    })
}

export default withMermaid(
  defineConfig({
    vite: {
      optimizeDeps: {
        include: ['mermaid'],
      },
    },
    title: 'Canopy',
    description: 'Universal data UI client',

    base: '/canopy/',

    themeConfig: {
      nav: [
        { text: 'Philosophy', link: '/philosophy' },
        { text: 'Architecture', link: '/architecture' },
        { text: 'Rhizome', link: 'https://rhizome-lab.github.io/' },
      ],

      sidebar: {
        '/': [
          {
            text: 'Design',
            items: [
              { text: 'Philosophy', link: '/philosophy' },
              { text: 'Architecture', link: '/architecture' },
            ]
          },
          {
            text: 'Design Docs',
            collapsed: true,
            items: getSidebarItems('design'),
          },
        ]
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/rhizome-lab/canopy' }
      ],

      search: {
        provider: 'local'
      },

      editLink: {
        pattern: 'https://github.com/rhizome-lab/canopy/edit/master/docs/:path',
        text: 'Edit this page on GitHub'
      },
    },
  }),
)

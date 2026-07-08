import { Activity } from 'lucide-react'

const links = [
  {
    title: 'Project',
    items: [
      { label: 'Platform', href: '#platform' },
      { label: 'Technology', href: '#technology' },
      { label: 'Command Center', href: '/command' },
      { label: 'Roadmap', href: '#vision' },
      { label: 'How It Works', href: '#how-it-works' },
    ],
  },
  {
    title: 'Research',
    items: [
      { label: 'Overview', href: '#research' },
      { label: 'Data Sources', href: '#research' },
      { label: 'Publications', href: '#research' },
      { label: 'Methodology', href: '#research' },
    ],
  },
  {
    title: 'Connect',
    items: [
      { label: 'GitHub', href: 'https://github.com' },
      { label: 'Contact', href: 'mailto:anant1000028304@gmail.com' },
      { label: 'Request Demo', href: '#contact' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#060D18] border-t border-white/8 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-sm">
                <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-white">IEHN</span>
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed max-w-[200px]">
              Intelligent Emergency Healthcare Network. AI for when seconds matter.
            </p>
            <div className="flex items-center gap-1.5 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[12px] text-[#10B981] font-medium">System operational</span>
            </div>
          </div>

          {/* Link columns */}
          {links.map((group) => (
            <div key={group.title}>
              <p className="text-[11px] font-bold text-white/45 uppercase tracking-widest mb-4">
                {group.title}
              </p>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-[13px] text-white/45 hover:text-white transition-colors duration-150 cursor-pointer"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[12px] text-white/30">
            © 2026 Intelligent Emergency Healthcare Network — Master's Research Project.
          </p>
          <p className="text-[12px] text-white/30">
            India · Germany · Open Research
          </p>
        </div>
      </div>
    </footer>
  )
}

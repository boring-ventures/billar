import AnimatedLogo from "@/components/animated-logo"
import LogoShowcase from "@/components/logo-showcase"

export default function LogoPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center">8ball Logo</h1>

        <div className="flex flex-col items-center justify-center mb-16">
          <AnimatedLogo size={200} className="mb-8" />
          <p className="text-gray-400 max-w-2xl text-center">
            A modern, minimalistic 2D logo for the 8ball application. The design features a clean sphere with the number
            "8" prominently displayed in the center.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-4">Design Principles</h2>
            <ul className="space-y-2 text-gray-400">
              <li>
                • <span className="font-medium text-white">Minimalism:</span> Clean, simple design with essential
                elements only
              </li>
              <li>
                • <span className="font-medium text-white">Recognition:</span> Instantly recognizable as a billiard
                8-ball
              </li>
              <li>
                • <span className="font-medium text-white">Versatility:</span> Works well at different sizes and in
                different contexts
              </li>
              <li>
                • <span className="font-medium text-white">Memorability:</span> Simple enough to be remembered after a
                single viewing
              </li>
              <li>
                • <span className="font-medium text-white">Timelessness:</span> Avoids trendy elements that might
                quickly date the design
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Technical Specifications</h2>
            <ul className="space-y-2 text-gray-400">
              <li>
                • <span className="font-medium text-white">Format:</span> SVG (scalable vector graphic)
              </li>
              <li>
                • <span className="font-medium text-white">Colors:</span> Black, white, with subtle highlights
              </li>
              <li>
                • <span className="font-medium text-white">Typography:</span> Custom "8" designed for optimal legibility
              </li>
              <li>
                • <span className="font-medium text-white">Responsive:</span> Scales perfectly from favicon to billboard
                size
              </li>
              <li>
                • <span className="font-medium text-white">Implementation:</span> React component for easy integration
              </li>
            </ul>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">Color Variations</h2>
        <LogoShowcase className="mb-16" />

        <div className="bg-zinc-900 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Usage Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-medium mb-2 text-green-500">Do</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• Maintain the logo's proportions when resizing</li>
                <li>• Ensure adequate contrast with the background</li>
                <li>• Use the provided color variations</li>
                <li>• Allow sufficient clear space around the logo</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2 text-red-500">Don't</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• Stretch or distort the logo</li>
                <li>• Add effects like shadows or glows</li>
                <li>• Change the font of the number "8"</li>
                <li>• Use the logo on cluttered backgrounds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { CheckCircle, Package, Truck, PackageCheck, XCircle } from 'lucide-react'

const STEPS = [
  { key: 'PLACED',    label: 'Order Placed',  Icon: Package },
  { key: 'CONFIRMED', label: 'Confirmed',      Icon: CheckCircle },
  { key: 'SHIPPED',   label: 'Shipped',        Icon: Truck },
  { key: 'DELIVERED', label: 'Delivered',      Icon: PackageCheck },
]

export default function OrderStatusStepper({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <XCircle size={24} className="text-red-400" />
        <div>
          <p className="font-semibold text-red-400">Order Cancelled</p>
          <p className="text-xs text-slate-400">This order has been cancelled.</p>
        </div>
      </div>
    )
  }

  const currentIdx = STEPS.findIndex(s => s.key === status)

  return (
    <div className="w-full py-4">
      <div className="flex items-start justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-navy-700 z-0" style={{ left: '12.5%', right: '12.5%' }} />
        <div
          className="absolute top-5 h-0.5 bg-gradient-to-r from-teal-600 to-teal-400 z-0 transition-all duration-700"
          style={{
            left: '12.5%',
            width: `${(currentIdx / (STEPS.length - 1)) * 75}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const isDone    = idx < currentIdx
          const isCurrent = idx === currentIdx
          const { Icon } = step

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 z-10" style={{ flex: 1 }}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                ${isDone    ? 'bg-teal-600 border-teal-500 text-white' : ''}
                ${isCurrent ? 'bg-amber-500 border-amber-400 text-navy-900 animate-pulse' : ''}
                ${!isDone && !isCurrent ? 'bg-navy-800 border-navy-600 text-slate-500' : ''}
              `}>
                <Icon size={18} />
              </div>
              <span className={`text-xs font-medium text-center leading-tight
                ${isDone || isCurrent ? 'text-slate-200' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

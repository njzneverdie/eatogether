'use client'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import RestaurantPhoto from '@/components/shared/RestaurantPhoto'
import type { Restaurant } from '@/types/domain'

const RANK_COLORS = [
  { bg: '#F5C842', text: '#7A5C00', pts: 5 },
  { bg: '#BCC4D0', text: '#3D4759', pts: 3 },
  { bg: '#CF8B5A', text: '#5C2C0A', pts: 1 },
]

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16">
      <path
        d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.4l-3.7 2 .7-4.1-3-2.9 4.2-.8z"
        fill={filled ? '#f97316' : '#d4d8e8'}
      />
    </svg>
  )
}

function SortableItem({ restaurant, index }: { restaurant: Restaurant; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: restaurant.id })

  const isTop3 = index < 3
  const rankColor = RANK_COLORS[index]

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 p-3 rounded-2xl border bg-white cursor-grab active:cursor-grabbing select-none transition-shadow ${
        isDragging ? 'shadow-lg scale-[1.02]' : ''
      } ${isTop3 ? 'border-[#e4d4a0]' : 'border-[#e4e7f0]'}`}
    >
      {/* Rank badge */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={rankColor ? { backgroundColor: rankColor.bg, color: rankColor.text } : { backgroundColor: '#f0f2f8', color: '#8b95c4' }}
      >
        {index + 1}
      </div>

      {/* Photo */}
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        <RestaurantPhoto photoRef={restaurant.photo_ref} name={restaurant.name} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#1a1f36] text-sm truncate">{restaurant.name}</p>
        {restaurant.rating && (
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon key={i} filled={i < Math.floor(restaurant.rating!)} />
            ))}
            <span className="text-[10px] text-[#8b95c4] ml-1 tabular-nums">{restaurant.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Points label (top 3 only) */}
      {rankColor && (
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-bold tabular-nums" style={{ color: rankColor.text }}>+{rankColor.pts}</p>
          <p className="text-[10px] text-[#8b95c4]">分</p>
        </div>
      )}

      {/* Drag handle */}
      <div className="flex flex-col gap-0.5 flex-shrink-0 opacity-25 pl-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-3.5 h-0.5 bg-[#1a1f36] rounded-full" />
        ))}
      </div>
    </div>
  )
}

interface Props {
  restaurants: Restaurant[]
  onChange: (ordered: Restaurant[]) => void
}

export default function RankBallot({ restaurants, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = restaurants.findIndex((r) => r.id === active.id)
      const newIdx = restaurants.findIndex((r) => r.id === over.id)
      onChange(arrayMove(restaurants, oldIdx, newIdx))
    }
  }

  return (
    <div className="space-y-2 p-4">
      {/* Weight legend */}
      <div className="flex items-center gap-2 mb-3">
        {RANK_COLORS.map((c, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: c.bg, color: c.text }}>{i + 1}</div>
            <span className="text-[10px] text-[#8b95c4]">+{c.pts}分</span>
          </div>
        ))}
        <span className="text-[10px] text-[#8b95c4] ml-auto">長按拖曳排序</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={restaurants.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {restaurants.map((r, i) => (
            <SortableItem key={r.id} restaurant={r} index={i} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

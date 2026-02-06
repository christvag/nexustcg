'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'

interface PopReportTableProps {
  cardName: string
  cardGame: string
}

// Grade columns in display order (highest to lowest)
const GRADE_COLUMNS = [
  '10+', '10', '9.5', '9', '8.5', '8', '7.5', '7',
  '6.5', '6', '5.5', '5', '4.5', '4', '3.5', '3',
  '2.5', '2', '1.5', '1', 'Auth'
]

function getHeaderStyle(grade: string): string {
  if (grade === '10') return 'bg-black text-white'
  if (grade === '10+' || grade === '9.5') return 'bg-[#c5a44e] text-white'
  return 'bg-[#0f1b2d] text-gray-300'
}

function getCellStyle(grade: string, count: number): string {
  if (count === 0) return 'text-gray-500'
  if (grade === '10') return 'bg-black/20 font-bold text-white'
  if (grade === '10+' || grade === '9.5') return 'bg-[#c5a44e]/10 font-bold text-[#c5a44e]'
  return 'text-white font-semibold'
}

// Convert grade to URL-safe string for element IDs
function gradeToId(grade: string): string {
  return grade.replace('+', 'plus').replace('.', '-')
}

export default function PopReportTable({ cardName, cardGame }: PopReportTableProps) {
  const [popData, setPopData] = useState<{
    total: number
    grades: Record<string, number>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!cardName || !cardGame) return

    const fetchPopReport = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/public/population-report/pop-report?card_name=${encodeURIComponent(cardName)}&card_game=${encodeURIComponent(cardGame)}`
        )
        const result = await response.json()

        if (result.success) {
          setPopData(result.data)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPopReport()
  }, [cardName, cardGame])

  // Don't render anything if error or no data
  if (error) return null
  if (!loading && (!popData || popData.total === 0)) return null

  if (loading) {
    return (
      <motion.div
        id="pop-report-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-10"
      >
        <div id="pop-report-title" className="flex items-center mb-4">
          <BarChart3 className="h-5 w-5 text-[#d83f0a] mr-2" />
          <h2 className="text-xl font-bold text-white">POP REPORT</h2>
        </div>
        <div id="pop-report-loading" className="bg-[#0a1628] rounded-xl border border-gray-700 p-6">
          <div className="animate-pulse flex space-x-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-800 rounded flex-1" />
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  if (!popData) return null

  const buildGradeLink = (grade: string) => {
    return `/population-report/cards?card_name=${encodeURIComponent(cardName)}&card_game=${encodeURIComponent(cardGame)}&grade=${encodeURIComponent(grade)}`
  }

  return (
    <motion.div
      id="pop-report-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-10"
    >
      <div id="pop-report-title" className="flex items-center mb-4">
        <BarChart3 className="h-5 w-5 text-[#d83f0a] mr-2" />
        <h2 className="text-xl font-bold text-white">POP REPORT</h2>
      </div>

      <div id="pop-report-table-container" className="bg-[#0a1628] rounded-xl border border-gray-700/50 overflow-x-auto">
        <table id="pop-report-table" className="w-full min-w-[900px]">
          <thead>
            <tr id="pop-report-header-row">
              <th
                id="pop-report-header-total"
                className="bg-[#d83f0a] text-white font-bold text-xs text-center px-3 py-3 border-r border-[#0a1628] whitespace-nowrap"
              >
                <div>Total</div>
                <div className="text-[10px] font-normal text-white/70">(Cards Graded)</div>
              </th>
              {GRADE_COLUMNS.map(grade => (
                <th
                  key={grade}
                  id={`pop-report-header-${gradeToId(grade)}`}
                  className={`${getHeaderStyle(grade)} text-xs font-semibold text-center px-2 py-3 border-r border-[#0a1628] last:border-r-0 whitespace-nowrap`}
                >
                  {grade}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr id="pop-report-data-row" className="border-t border-gray-700/50 bg-[#111e33]">
              <td
                id="pop-report-count-total"
                className="font-bold text-white text-center text-sm px-3 py-3 border-r border-gray-700/50"
              >
                {popData.total}
              </td>
              {GRADE_COLUMNS.map(grade => {
                const count = popData.grades[grade] || 0
                return (
                  <td
                    key={grade}
                    id={`pop-report-count-${gradeToId(grade)}`}
                    className={`${getCellStyle(grade, count)} text-center text-sm px-2 py-3 border-r border-gray-700/50 last:border-r-0`}
                  >
                    {count > 0 ? (
                      <Link
                        href={buildGradeLink(grade)}
                        className="underline hover:text-[#d83f0a] transition-colors"
                      >
                        {count}
                      </Link>
                    ) : (
                      <span>{count}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorldStore } from '@/store/useWorldStore'
import { useAudioManager } from '@/hooks/useAudioManager'

export default function PassportStampToast() {
  const passportStampVisible = useWorldStore((s) => s.passportStampVisible)
  const setPassportStampVisible = useWorldStore((s) => s.setPassportStampVisible)
  const { playArrivalChime, playPageTurn } = useAudioManager()

  useEffect(() => {
    if (!passportStampVisible) return

    playArrivalChime()

    const timer = setTimeout(() => {
      setPassportStampVisible(false)
    }, 6500)

    return () => clearTimeout(timer)
  }, [passportStampVisible, playArrivalChime, setPassportStampVisible])

  const dismiss = () => {
    playPageTurn()
    setPassportStampVisible(false)
  }

  const currentDate = new Date().toISOString().split('T')[0]

  return (
    <AnimatePresence>
      {passportStampVisible && (
        <div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4"
          aria-live="assertive"
        >
          <motion.div
            initial={{ scale: 2.4, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: -4 }}
            exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.3 } }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 22,
            }}
            onClick={dismiss}
            className="pointer-events-auto cursor-pointer select-none bg-[#FAF9F5] border-4 border-black p-6 md:p-8 max-w-sm w-full text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative"
          >
            {/* Ink Stamp Double Ring */}
            <div className="border-2 border-dashed border-black/70 p-4 relative">
              <div className="font-mono text-[9px] font-black tracking-widest uppercase text-black/60 mb-1">
                ★ BABWORLD SPHERICAL REALM ★
              </div>

              <h2 className="font-merriweather text-2xl md:text-3xl font-black text-black tracking-tight uppercase my-2">
                TOUR COMPLETED
              </h2>

              <div className="w-16 h-0.5 bg-black mx-auto my-2" />

              <p className="font-mono text-[10px] font-bold tracking-wider text-black/80 uppercase">
                50M CURVATURE • FULL LOOP WALKED
              </p>

              <div className="mt-4 pt-3 border-t border-black/20 flex items-center justify-between text-[10px] font-mono text-black/60">
                <span>STAMP #001</span>
                <span>{currentDate}</span>
              </div>
            </div>

            <div className="mt-3 text-[10px] font-mono text-black/40 uppercase tracking-widest">
              [ CLICK ANYWHERE TO DISMISS ]
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

import { Toaster as Sonner } from 'sonner'
import { useAppearance } from '@/hooks/use-appearance'
import { useState, useEffect } from 'react'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { appearance } = useAppearance()
    const [isRTL, setIsRTL] = useState(false)
    
    // Read RTL status from document (works outside Inertia context)
    useEffect(() => {
        const checkRTL = () => {
            if (typeof document === 'undefined') return false
            const htmlElement = document.documentElement
            const dir = htmlElement.getAttribute('dir')
            const lang = htmlElement.lang || htmlElement.getAttribute('lang')
            return dir === 'rtl' || lang === 'ar'
        }
        
        // Set initial value
        setIsRTL(checkRTL())
        
        // Watch for changes to dir or lang attributes
        const observer = new MutationObserver(() => {
            setIsRTL(checkRTL())
        })
        
        if (typeof document !== 'undefined') {
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['dir', 'lang']
            })
        }
        
        return () => observer.disconnect()
    }, [])
    
    // Map appearance to theme ('light' | 'dark' | 'system')
    const theme = appearance === 'system' ? 'system' : appearance
    
    // Position toast on left side for RTL, right side for LTR
    const position = isRTL ? 'top-left' : 'top-right'

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            position={position}
            gap={12}
            richColors
            toastOptions={{
                classNames: {
                    toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                    description: 'group-[.toast]:text-muted-foreground',
                    actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                },
            }}
            {...props}
        />
    )
}

export { Toaster }


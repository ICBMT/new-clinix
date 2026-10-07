import * as React from "react"
import { StatusBadge } from "./status-badge"
import { useTranslation } from "@/hooks/use-translation"

export interface ActiveStatusBadgeProps {
  status: 'active' | 'inactive'
  className?: string
}

export function ActiveStatusBadge({ status, className }: ActiveStatusBadgeProps) {
  const { t } = useTranslation()
  
  const variant = status === 'active' ? 'default' : 'secondary'
  const badgeClassName = status === 'active' 
    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:text-green-900' 
    : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-foreground'
  
  return (
    <StatusBadge variant={variant} className={`${badgeClassName} ${className || ''}`}>
      {status === 'active' ? t('active') : t('inactive')}
    </StatusBadge>
  )
}

export interface VerificationStatusBadgeProps {
  isVerified: boolean
  className?: string
}

export function VerificationStatusBadge({ isVerified, className }: VerificationStatusBadgeProps) {
  const { t } = useTranslation()
  
  const variant = isVerified ? 'default' : 'secondary'
  const badgeClassName = isVerified 
    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:text-green-900' 
    : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-foreground'
  
  return (
    <StatusBadge variant={variant} className={`${badgeClassName} ${className || ''}`}>
      {isVerified ? t('verified') : t('not_verified')}
    </StatusBadge>
  )
}

export interface VendorVerificationStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected'
  className?: string
}

export function VendorVerificationStatusBadge({ status, className }: VendorVerificationStatusBadgeProps) {
  const { t } = useTranslation()
  
  let variant: 'default' | 'secondary' | 'destructive' = 'secondary'
  let badgeClassName = ''
  
  if (status === 'approved') {
    variant = 'default'
    badgeClassName = 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:text-green-900'
  } else if (status === 'pending') {
    variant = 'secondary'
    badgeClassName = 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-900'
  } else if (status === 'rejected') {
    variant = 'destructive'
    badgeClassName = 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:text-red-900'
  }
  
  return (
    <StatusBadge variant={variant} className={`${badgeClassName} ${className || ''}`}>
      {t(status)}
    </StatusBadge>
  )
}

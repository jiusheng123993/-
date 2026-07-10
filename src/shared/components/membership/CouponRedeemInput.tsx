import { useState } from 'react'

interface CouponRedeemInputProps {
  onRedeem: (code: string) => void
}

export function CouponRedeemInput({ onRedeem }: CouponRedeemInputProps) {
  const [code, setCode] = useState('')

  const handleRedeem = () => {
    const trimmed = code.trim()
    if (trimmed) {
      onRedeem(trimmed)
      setCode('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRedeem()
    }
  }

  return (
    <div className="membership-coupon-input-group">
      <input
        type="text"
        className="membership-coupon-input"
        placeholder="输入优惠券码"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button className="membership-coupon-apply" onClick={handleRedeem}>使用</button>
    </div>
  )
}

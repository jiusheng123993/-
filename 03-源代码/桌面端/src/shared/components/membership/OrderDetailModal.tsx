import type { FC } from 'react'
import type { MembershipFlowState } from '../../hooks/useMembershipFlow'
import styles from './MembershipPage.module.css'

interface OrderDetailModalProps {
  flow: MembershipFlowState
  onClose: () => void
}

export const OrderDetailModal: FC<OrderDetailModalProps> = ({ flow, onClose }) => {
  const { selectedOrder, getProductName, getChannelLabel, getStatusLabel, getStatusColor, formatPrice, handleRefundOrder } = flow

  if (!selectedOrder) return null

  return (
    <div className="membership-modal-backdrop" onClick={onClose} role="presentation">
      <section
        aria-modal="true"
        className="membership-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="订单详情"
        style={{ maxWidth: 500 }}
      >
        <header className="membership-modal-hero">
          <div className="membership-modal-hero-text">
            <p className="eyebrow">Order Detail · 订单详情</p>
            <h2>订单 #{selectedOrder.id.slice(0, 12)}...</h2>
          </div>
          <button className="membership-modal-close" onClick={onClose} type="button">×</button>
        </header>
        <div className="membership-modal-content">
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <strong>订单 ID</strong>
              <code style={{ display: 'block', marginTop: 4, fontSize: 12 }}>{selectedOrder.id}</code>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <strong>商品</strong>
                <p style={{ margin: '4px 0 0' }}>{getProductName(selectedOrder.productId)}</p>
              </div>
              <div>
                <strong>支付方式</strong>
                <p style={{ margin: '4px 0 0' }}>{getChannelLabel(selectedOrder.channel)}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <strong>金额</strong>
                <p style={{ margin: '4px 0 0', color: '#10b981', fontWeight: 'bold' }}>
                  {formatPrice(selectedOrder.amount)}
                </p>
              </div>
              <div>
                <strong>状态</strong>
                <p style={{ margin: '4px 0 0', color: getStatusColor(selectedOrder.status) }}>
                  {getStatusLabel(selectedOrder.status)}
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <strong>创建时间</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                  {new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <strong>支付时间</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                  {selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleString('zh-CN') : '-'}
                </p>
              </div>
            </div>
            {selectedOrder.channelTradeNo && (
              <div>
                <strong>渠道订单号</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>{selectedOrder.channelTradeNo}</p>
              </div>
            )}
            {selectedOrder.status === 'paid' && (
              <button
                className={styles.purchaseButton}
                onClick={() => handleRefundOrder(selectedOrder.id)}
                style={{ background: '#ef4444', marginTop: 8 }}
              >
                申请退款
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

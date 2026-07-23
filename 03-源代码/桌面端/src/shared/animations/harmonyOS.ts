export const harmonyOS = {
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  card: {
    hover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    active: {
      transform: 'scale(0.98)',
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    drag: {
      opacity: '0.8',
      transform: 'scale(1.02)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.16)',
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  sidebar: {
    open: {
      transform: 'translateX(0)',
      transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    closed: {
      transform: 'translateX(-100%)',
      transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  toast: {
    enter: {
      opacity: '0',
      transform: 'scale(0.9)',
      transition: 'all 150ms cubic-bezier(0.34, 1.56, 0.64, 1)'
    },
    visible: {
      opacity: '1',
      transform: 'scale(1)'
    },
    exit: {
      opacity: '0',
      transform: 'scale(0.9)',
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}

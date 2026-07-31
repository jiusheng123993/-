/**
 * 宠物切换器组件测试
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

vi.mock('@tarojs/components', () => ({
  View: ({ children, className, style, onClick, onLongPress }: any) => (
    <div className={className} style={style} onClick={onClick} onContextMenu={onLongPress}>{children}</div>
  ),
  Text: ({ children, className, style }: any) => (
    <span className={className} style={style}>{children}</span>
  ),
  Image: ({ src, className, mode, lazyLoad }: any) => (
    <img src={src} className={className} data-mode={mode} data-lazyLoad={lazyLoad} />
  ),
  Picker: ({ children, mode, value, onChange }: any) => (
    <div data-mode={mode} data-value={value} onClick={() => onChange?.({ detail: { value: '2026-01-15' } })}>{children}</div>
  ),
  ScrollView: ({ children, className, scrollX }: any) => (
    <div className={className} data-scrollX={scrollX}>{children}</div>
  ),
}))

vi.mock('../PetSwitcher.scss', () => ({}))

import PetSwitcher from '../PetSwitcher'
import type { PetProfile } from '../../services/petService'

const makePet = (overrides: Partial<PetProfile> & { id: string }): PetProfile => ({
  userId: 'user-1',
  name: '旺财',
  species: 'dog',
  breed: '金毛',
  breedId: 'breed-1',
  gender: 'male',
  birthDate: '2024-04-15',
  weight: 25,
  coatColor: '',
  photos: [],
  isNeutered: false,
  microchipId: '',
  notes: '',
  isDeceased: false,
  allergies: [],
  medications: [],
  chronicConditions: [],
  createdAt: '2024-04-15',
  updatedAt: '2024-04-15',
  ...overrides,
})

const pets: PetProfile[] = [
  makePet({ id: 'pet-1', name: '旺财', species: 'dog' }),
  makePet({ id: 'pet-2', name: '咪咪', species: 'cat' }),
  makePet({ id: 'pet-3', name: '豆豆', species: 'dog' }),
]

describe('PetSwitcher', () => {
  it('renders all pets', () => {
    const { getByText } = render(<PetSwitcher pets={pets} currentPetId="pet-1" onSwitch={vi.fn()} />)
    expect(getByText('旺财')).toBeDefined()
    expect(getByText('咪咪')).toBeDefined()
    expect(getByText('豆豆')).toBeDefined()
  })

  it('active pet has --active class', () => {
    const { container } = render(<PetSwitcher pets={pets} currentPetId="pet-1" onSwitch={vi.fn()} />)
    const activeItem = container.querySelector('.pet-switcher__item--active')
    expect(activeItem).not.toBeNull()
    expect(activeItem!.textContent).toContain('旺财')
  })

  it('click on pet calls onSwitch with pet.id', () => {
    const onSwitch = vi.fn()
    const { getByText } = render(<PetSwitcher pets={pets} currentPetId="pet-1" onSwitch={onSwitch} />)
    fireEvent.click(getByText('咪咪'))
    expect(onSwitch).toHaveBeenCalledWith('pet-2')
  })

  it('shows add button when onAdd provided', () => {
    const { getByText } = render(<PetSwitcher pets={pets} currentPetId="pet-1" onSwitch={vi.fn()} onAdd={vi.fn()} />)
    expect(getByText('添加')).toBeDefined()
    expect(getByText('+')).toBeDefined()
  })

  it('does not show add button when onAdd not provided', () => {
    const { queryByText } = render(<PetSwitcher pets={pets} currentPetId="pet-1" onSwitch={vi.fn()} />)
    expect(queryByText('添加')).toBeNull()
    expect(queryByText('+')).toBeNull()
  })

  it('click add button calls onAdd', () => {
    const onAdd = vi.fn()
    const { getByText } = render(<PetSwitcher pets={pets} currentPetId="pet-1" onSwitch={vi.fn()} onAdd={onAdd} />)
    fireEvent.click(getByText('+'))
    expect(onAdd).toHaveBeenCalled()
  })

  it('deceased pet has --deceased class', () => {
    const deceasedPets = [
      makePet({ id: 'pet-1', name: '旺财', isDeceased: true }),
      makePet({ id: 'pet-2', name: '咪咪' }),
    ]
    const { container } = render(<PetSwitcher pets={deceasedPets} currentPetId="pet-2" onSwitch={vi.fn()} />)
    const deceasedItem = container.querySelector('.pet-switcher__item--deceased')
    expect(deceasedItem).not.toBeNull()
    expect(deceasedItem!.textContent).toContain('旺财')
  })

  it('shows pet name', () => {
    const { getByText } = render(<PetSwitcher pets={pets} currentPetId="pet-1" onSwitch={vi.fn()} />)
    expect(getByText('旺财')).toBeDefined()
    expect(getByText('咪咪')).toBeDefined()
  })

  it('shows dog emoji for dog without avatar', () => {
    const { getAllByText } = render(<PetSwitcher pets={pets} currentPetId="pet-1" onSwitch={vi.fn()} />)
    const dogEmojis = getAllByText('🐕')
    expect(dogEmojis.length).toBe(2)
  })

  it('shows cat emoji for cat without avatar', () => {
    const { getByText } = render(<PetSwitcher pets={pets} currentPetId="pet-1" onSwitch={vi.fn()} />)
    expect(getByText('🐱')).toBeDefined()
  })

  it('shows image for pets with avatarPhotoUrl', () => {
    const petsWithAvatar = [
      makePet({ id: 'pet-1', name: '旺财', avatarPhotoUrl: 'https://example.com/dog.jpg' }),
    ]
    const { container } = render(<PetSwitcher pets={petsWithAvatar} currentPetId="pet-1" onSwitch={vi.fn()} />)
    const img = container.querySelector('.pet-switcher__avatar-img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe('https://example.com/dog.jpg')
  })

  it('renders with empty pets array', () => {
    const { container } = render(<PetSwitcher pets={[]} currentPetId={null} onSwitch={vi.fn()} />)
    const items = container.querySelectorAll('.pet-switcher__item')
    expect(items.length).toBe(0)
  })
})

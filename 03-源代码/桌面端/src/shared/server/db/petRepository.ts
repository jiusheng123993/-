import { getDbClient } from './migration'

export interface DbPetProfile {
  id: string
  user_id: string
  name: string
  species: string
  breed: string | null
  gender: string | null
  birth_date: string | null
  adoption_date: string | null
  weight: number | null
  avatar_url: string | null
  is_neutered: boolean
  is_deceased: boolean
  deceased_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DbPetHealthEntry {
  id: string
  pet_id: string
  user_id: string
  entry_date: string
  appetite: string
  energy: string
  stool: string
  mood: string
  weight: number | null
  symptoms: string[] | null
  notes: string | null
  ai_feedback: Record<string, unknown> | null
  created_at: string
}

export interface DbPetFoodQuery {
  id: string
  user_id: string
  pet_id: string | null
  food_name: string
  species: string
  safety_level: string
  description: string | null
  created_at: string
}

export interface DbPetSymptomCheck {
  id: string
  pet_id: string
  user_id: string
  symptoms: string[]
  duration: string
  severity: string
  urgency_level: string
  possible_conditions: Record<string, unknown>[]
  ai_advice: string | null
  disclaimer_accepted: boolean
  created_at: string
}

export interface DbPetVaccination {
  id: string
  pet_id: string
  user_id: string
  vaccine_name: string
  vaccine_type: string
  scheduled_date: string
  completed_date: string | null
  is_overdue: boolean
  provider: string | null
  batch_number: string | null
  notes: string | null
  next_due_date: string | null
  created_at: string
  updated_at: string
}

export interface DbPetHealthTrend {
  id: string
  pet_id: string
  user_id: string
  period_start: string
  period_end: string
  period_type: string
  weight_trend: Record<string, unknown> | null
  appetite_trend: Record<string, unknown> | null
  stool_trend: Record<string, unknown> | null
  mood_trend: Record<string, unknown> | null
  anomaly_flags: Record<string, unknown>[]
  monthly_summary: Record<string, unknown> | null
  created_at: string
}

export interface DbMembership {
  id: string
  user_id: string
  plan: string
  status: string
  started_at: string
  expires_at: string
  auto_renew: boolean
  source_order_id: string | null
  created_at: string
  updated_at: string
}

export interface DbUsageQuota {
  id: string
  user_id: string
  quota_type: string
  period_start: string
  period_end: string
  used_count: number
  max_count: number
  created_at: string
  updated_at: string
}

export interface DbEmotionTrigger {
  id: string
  user_id: string
  pet_id: string | null
  trigger_type: string
  emotion: string
  intensity: string
  context: Record<string, unknown>
  ai_response: string | null
  created_at: string
}

export interface DbPetGriefSession {
  id: string
  user_id: string
  pet_id: string | null
  stage: string
  messages: Record<string, unknown>[]
  started_at: string
  ended_at: string | null
  is_active: boolean
}

export const petProfileRepo = {
  async create(profile: {
    userId: string
    name: string
    species: string
    breed?: string
    gender?: string
    birthDate?: string
    adoptionDate?: string
    weight?: number
    avatarUrl?: string
    isNeutered?: boolean
    notes?: string
  }): Promise<DbPetProfile> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_profiles')
      .insert({
        user_id: profile.userId,
        name: profile.name,
        species: profile.species,
        breed: profile.breed || null,
        gender: profile.gender || null,
        birth_date: profile.birthDate || null,
        adoption_date: profile.adoptionDate || null,
        weight: profile.weight || null,
        avatar_url: profile.avatarUrl || null,
        is_neutered: profile.isNeutered || false,
        notes: profile.notes || null
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create pet profile: ${error.message}`)
    return data as DbPetProfile
  },

  async findById(id: string, userId: string): Promise<DbPetProfile | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_profiles')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return undefined
    return data as DbPetProfile
  },

  async findByUserId(userId: string): Promise<DbPetProfile[]> {
    const client = getDbClient()
    const { data } = await client
      .from('pet_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return (data as DbPetProfile[]) || []
  },

  async update(
    id: string,
    userId: string,
    updates: Partial<Pick<DbPetProfile, 'name' | 'breed' | 'gender' | 'birth_date' | 'adoption_date' | 'weight' | 'avatar_url' | 'is_neutered' | 'is_deceased' | 'deceased_date' | 'notes'>>
  ): Promise<DbPetProfile | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) return undefined
    return data as DbPetProfile
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('pet_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }
}

export const petHealthEntryRepo = {
  async create(entry: {
    petId: string
    userId: string
    entryDate: string
    appetite: string
    energy: string
    stool: string
    mood: string
    weight?: number
    symptoms?: string[]
    notes?: string
    aiFeedback?: Record<string, unknown>
  }): Promise<DbPetHealthEntry> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_health_entries')
      .insert({
        pet_id: entry.petId,
        user_id: entry.userId,
        entry_date: entry.entryDate,
        appetite: entry.appetite,
        energy: entry.energy,
        stool: entry.stool,
        mood: entry.mood,
        weight: entry.weight || null,
        symptoms: entry.symptoms || null,
        notes: entry.notes || null,
        ai_feedback: entry.aiFeedback || null
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create health entry: ${error.message}`)
    return data as DbPetHealthEntry
  },

  async findById(id: string, userId: string): Promise<DbPetHealthEntry | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_health_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return undefined
    return data as DbPetHealthEntry
  },

  async findByPetId(petId: string, userId: string, options?: { limit?: number; offset?: number }): Promise<DbPetHealthEntry[]> {
    const client = getDbClient()
    let query = client
      .from('pet_health_entries')
      .select('*')
      .eq('pet_id', petId)
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data } = await query
    return (data as DbPetHealthEntry[]) || []
  },

  async findByDate(petId: string, userId: string, entryDate: string): Promise<DbPetHealthEntry | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_health_entries')
      .select('*')
      .eq('pet_id', petId)
      .eq('user_id', userId)
      .eq('entry_date', entryDate)
      .single()

    if (error || !data) return undefined
    return data as DbPetHealthEntry
  },

  async update(
    id: string,
    userId: string,
    updates: Partial<Pick<DbPetHealthEntry, 'appetite' | 'energy' | 'stool' | 'mood' | 'weight' | 'symptoms' | 'notes' | 'ai_feedback'>>
  ): Promise<DbPetHealthEntry | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_health_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) return undefined
    return data as DbPetHealthEntry
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('pet_health_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }
}

export const petFoodQueryRepo = {
  async create(query: {
    userId: string
    petId?: string
    foodName: string
    species: string
    safetyLevel: string
    description?: string
  }): Promise<DbPetFoodQuery> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_food_queries')
      .insert({
        user_id: query.userId,
        pet_id: query.petId || null,
        food_name: query.foodName,
        species: query.species,
        safety_level: query.safetyLevel,
        description: query.description || null
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create food query: ${error.message}`)
    return data as DbPetFoodQuery
  },

  async findById(id: string, userId: string): Promise<DbPetFoodQuery | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_food_queries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return undefined
    return data as DbPetFoodQuery
  },

  async findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<DbPetFoodQuery[]> {
    const client = getDbClient()
    let query = client
      .from('pet_food_queries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data } = await query
    return (data as DbPetFoodQuery[]) || []
  },

  async findByFoodName(userId: string, foodName: string): Promise<DbPetFoodQuery[]> {
    const client = getDbClient()
    const { data } = await client
      .from('pet_food_queries')
      .select('*')
      .eq('user_id', userId)
      .ilike('food_name', `%${foodName}%`)
      .order('created_at', { ascending: false })

    return (data as DbPetFoodQuery[]) || []
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('pet_food_queries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }
}

export const petSymptomCheckRepo = {
  async create(check: {
    petId: string
    userId: string
    symptoms: string[]
    duration: string
    severity: string
    urgencyLevel: string
    possibleConditions?: Record<string, unknown>[]
    aiAdvice?: string
    disclaimerAccepted?: boolean
  }): Promise<DbPetSymptomCheck> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_symptom_checks')
      .insert({
        pet_id: check.petId,
        user_id: check.userId,
        symptoms: check.symptoms,
        duration: check.duration,
        severity: check.severity,
        urgency_level: check.urgencyLevel,
        possible_conditions: check.possibleConditions || [],
        ai_advice: check.aiAdvice || null,
        disclaimer_accepted: check.disclaimerAccepted || false
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create symptom check: ${error.message}`)
    return data as DbPetSymptomCheck
  },

  async findById(id: string, userId: string): Promise<DbPetSymptomCheck | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_symptom_checks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return undefined
    return data as DbPetSymptomCheck
  },

  async findByPetId(petId: string, userId: string, options?: { limit?: number; offset?: number }): Promise<DbPetSymptomCheck[]> {
    const client = getDbClient()
    let query = client
      .from('pet_symptom_checks')
      .select('*')
      .eq('pet_id', petId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data } = await query
    return (data as DbPetSymptomCheck[]) || []
  },

  async findByUrgency(userId: string, urgencyLevel: string): Promise<DbPetSymptomCheck[]> {
    const client = getDbClient()
    const { data } = await client
      .from('pet_symptom_checks')
      .select('*')
      .eq('user_id', userId)
      .eq('urgency_level', urgencyLevel)
      .order('created_at', { ascending: false })

    return (data as DbPetSymptomCheck[]) || []
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('pet_symptom_checks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }
}

export const petVaccinationRepo = {
  async create(vaccination: {
    petId: string
    userId: string
    vaccineName: string
    vaccineType: string
    scheduledDate: string
    completedDate?: string
    provider?: string
    batchNumber?: string
    notes?: string
    nextDueDate?: string
  }): Promise<DbPetVaccination> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_vaccinations')
      .insert({
        pet_id: vaccination.petId,
        user_id: vaccination.userId,
        vaccine_name: vaccination.vaccineName,
        vaccine_type: vaccination.vaccineType,
        scheduled_date: vaccination.scheduledDate,
        completed_date: vaccination.completedDate || null,
        provider: vaccination.provider || null,
        batch_number: vaccination.batchNumber || null,
        notes: vaccination.notes || null,
        next_due_date: vaccination.nextDueDate || null
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create vaccination: ${error.message}`)
    return data as DbPetVaccination
  },

  async findById(id: string, userId: string): Promise<DbPetVaccination | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_vaccinations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return undefined
    return data as DbPetVaccination
  },

  async findByPetId(petId: string, userId: string): Promise<DbPetVaccination[]> {
    const client = getDbClient()
    const { data } = await client
      .from('pet_vaccinations')
      .select('*')
      .eq('pet_id', petId)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: false })

    return (data as DbPetVaccination[]) || []
  },

  async findOverdue(userId: string): Promise<DbPetVaccination[]> {
    const client = getDbClient()
    const { data } = await client
      .from('pet_vaccinations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_overdue', true)
      .order('scheduled_date', { ascending: true })

    return (data as DbPetVaccination[]) || []
  },

  async update(
    id: string,
    userId: string,
    updates: Partial<Pick<DbPetVaccination, 'completed_date' | 'provider' | 'batch_number' | 'notes' | 'next_due_date'>>
  ): Promise<DbPetVaccination | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_vaccinations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) return undefined
    return data as DbPetVaccination
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('pet_vaccinations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }
}

export const petHealthTrendRepo = {
  async create(trend: {
    petId: string
    userId: string
    periodStart: string
    periodEnd: string
    periodType: string
    weightTrend?: Record<string, unknown>
    appetiteTrend?: Record<string, unknown>
    stoolTrend?: Record<string, unknown>
    moodTrend?: Record<string, unknown>
    anomalyFlags?: Record<string, unknown>[]
    monthlySummary?: Record<string, unknown>
  }): Promise<DbPetHealthTrend> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_health_trends')
      .insert({
        pet_id: trend.petId,
        user_id: trend.userId,
        period_start: trend.periodStart,
        period_end: trend.periodEnd,
        period_type: trend.periodType,
        weight_trend: trend.weightTrend || null,
        appetite_trend: trend.appetiteTrend || null,
        stool_trend: trend.stoolTrend || null,
        mood_trend: trend.moodTrend || null,
        anomaly_flags: trend.anomalyFlags || [],
        monthly_summary: trend.monthlySummary || null
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create health trend: ${error.message}`)
    return data as DbPetHealthTrend
  },

  async findById(id: string, userId: string): Promise<DbPetHealthTrend | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_health_trends')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return undefined
    return data as DbPetHealthTrend
  },

  async findByPetId(petId: string, userId: string, options?: { periodType?: string; limit?: number }): Promise<DbPetHealthTrend[]> {
    const client = getDbClient()
    let query = client
      .from('pet_health_trends')
      .select('*')
      .eq('pet_id', petId)
      .eq('user_id', userId)

    if (options?.periodType) {
      query = query.eq('period_type', options.periodType)
    }

    query = query
      .order('period_start', { ascending: false })
      .limit(options?.limit || 12)

    const { data } = await query
    return (data as DbPetHealthTrend[]) || []
  },

  async findByPeriod(petId: string, userId: string, periodStart: string, periodType: string): Promise<DbPetHealthTrend | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_health_trends')
      .select('*')
      .eq('pet_id', petId)
      .eq('user_id', userId)
      .eq('period_start', periodStart)
      .eq('period_type', periodType)
      .single()

    if (error || !data) return undefined
    return data as DbPetHealthTrend
  },

  async update(
    id: string,
    userId: string,
    updates: Partial<Pick<DbPetHealthTrend, 'weight_trend' | 'appetite_trend' | 'stool_trend' | 'mood_trend' | 'anomaly_flags' | 'monthly_summary'>>
  ): Promise<DbPetHealthTrend | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_health_trends')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) return undefined
    return data as DbPetHealthTrend
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('pet_health_trends')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }
}

export const membershipRepo = {
  async create(membership: {
    userId: string
    plan: string
    expiresAt: string
    autoRenew?: boolean
    sourceOrderId?: string
  }): Promise<DbMembership> {
    const client = getDbClient()
    const { data, error } = await client
      .from('memberships')
      .insert({
        user_id: membership.userId,
        plan: membership.plan,
        expires_at: membership.expiresAt,
        auto_renew: membership.autoRenew || false,
        source_order_id: membership.sourceOrderId || null
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create membership: ${error.message}`)
    return data as DbMembership
  },

  async findByUserId(userId: string): Promise<DbMembership | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) return undefined
    return data as DbMembership
  },

  async update(
    userId: string,
    updates: Partial<Pick<DbMembership, 'plan' | 'status' | 'expires_at' | 'auto_renew' | 'source_order_id'>>
  ): Promise<DbMembership | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('memberships')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) return undefined
    return data as DbMembership
  },

  async delete(userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('memberships')
      .delete()
      .eq('user_id', userId)

    return !error
  }
}

export const usageQuotaRepo = {
  async create(quota: {
    userId: string
    quotaType: string
    periodStart: string
    periodEnd: string
    maxCount: number
  }): Promise<DbUsageQuota> {
    const client = getDbClient()
    const { data, error } = await client
      .from('usage_quotas')
      .insert({
        user_id: quota.userId,
        quota_type: quota.quotaType,
        period_start: quota.periodStart,
        period_end: quota.periodEnd,
        used_count: 0,
        max_count: quota.maxCount
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create usage quota: ${error.message}`)
    return data as DbUsageQuota
  },

  async findByUserAndType(userId: string, quotaType: string, periodStart: string): Promise<DbUsageQuota | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('usage_quotas')
      .select('*')
      .eq('user_id', userId)
      .eq('quota_type', quotaType)
      .eq('period_start', periodStart)
      .single()

    if (error || !data) return undefined
    return data as DbUsageQuota
  },

  async findByUserId(userId: string): Promise<DbUsageQuota[]> {
    const client = getDbClient()
    const { data } = await client
      .from('usage_quotas')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })

    return (data as DbUsageQuota[]) || []
  },

  async incrementUsage(userId: string, quotaType: string, periodStart: string): Promise<DbUsageQuota | undefined> {
    const client = getDbClient()
    const { data: existing, error: findError } = await client
      .from('usage_quotas')
      .select('*')
      .eq('user_id', userId)
      .eq('quota_type', quotaType)
      .eq('period_start', periodStart)
      .single()

    if (findError || !existing) return undefined

    const current = existing as DbUsageQuota
    const { data, error } = await client
      .from('usage_quotas')
      .update({
        used_count: current.used_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', current.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) return undefined
    return data as DbUsageQuota
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('usage_quotas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }
}

export const emotionTriggerRepo = {
  async create(trigger: {
    userId: string
    petId?: string
    triggerType: string
    emotion: string
    intensity: string
    context?: Record<string, unknown>
    aiResponse?: string
  }): Promise<DbEmotionTrigger> {
    const client = getDbClient()
    const { data, error } = await client
      .from('emotion_triggers')
      .insert({
        user_id: trigger.userId,
        pet_id: trigger.petId || null,
        trigger_type: trigger.triggerType,
        emotion: trigger.emotion,
        intensity: trigger.intensity,
        context: trigger.context || {},
        ai_response: trigger.aiResponse || null
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create emotion trigger: ${error.message}`)
    return data as DbEmotionTrigger
  },

  async findById(id: string, userId: string): Promise<DbEmotionTrigger | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('emotion_triggers')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return undefined
    return data as DbEmotionTrigger
  },

  async findByUserId(userId: string, options?: { triggerType?: string; limit?: number; offset?: number }): Promise<DbEmotionTrigger[]> {
    const client = getDbClient()
    let query = client
      .from('emotion_triggers')
      .select('*')
      .eq('user_id', userId)

    if (options?.triggerType) {
      query = query.eq('trigger_type', options.triggerType)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50)

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data } = await query
    return (data as DbEmotionTrigger[]) || []
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('emotion_triggers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }
}

export const petGriefSessionRepo = {
  async create(session: {
    userId: string
    petId?: string
    stage: string
  }): Promise<DbPetGriefSession> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_grief_sessions')
      .insert({
        user_id: session.userId,
        pet_id: session.petId || null,
        stage: session.stage,
        messages: [],
        is_active: true
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create grief session: ${error.message}`)
    return data as DbPetGriefSession
  },

  async findById(id: string, userId: string): Promise<DbPetGriefSession | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_grief_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return undefined
    return data as DbPetGriefSession
  },

  async findActiveByUserId(userId: string): Promise<DbPetGriefSession | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_grief_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return undefined
    return data as DbPetGriefSession
  },

  async findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<DbPetGriefSession[]> {
    const client = getDbClient()
    let query = client
      .from('pet_grief_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data } = await query
    return (data as DbPetGriefSession[]) || []
  },

  async update(
    id: string,
    userId: string,
    updates: Partial<Pick<DbPetGriefSession, 'stage' | 'messages' | 'ended_at' | 'is_active'>>
  ): Promise<DbPetGriefSession | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_grief_sessions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) return undefined
    return data as DbPetGriefSession
  },

  async endSession(id: string, userId: string): Promise<DbPetGriefSession | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('pet_grief_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) return undefined
    return data as DbPetGriefSession
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('pet_grief_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }
}

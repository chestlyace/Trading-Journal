import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    useColorScheme,
    KeyboardAvoidingView,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/auth.store'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import { decode } from 'base64-arraybuffer'
import { useQueryClient } from '@tanstack/react-query'
import { tradeKeys } from '../../src/hooks/useTrades'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'

const ASSET_CLASSES = ['CRYPTO', 'FOREX', 'STOCKS', 'COMMODITIES'] as const
const SESSIONS = ['LONDON', 'NEW_YORK', 'TOKYO', 'SYDNEY', 'OVERLAP'] as const
const EMOTIONAL_STATES = ['CONFIDENT', 'NERVOUS', 'FOMO', 'CALM', 'IMPATIENT'] as const

export default function EditTradeScreen() {
    const { id } = useLocalSearchParams()
    const isDark = useColorScheme() === 'dark'
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    // Loading state
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [originalTrade, setOriginalTrade] = useState<any>(null)

    // Step 1 fields
    const [instrument, setInstrument] = useState('')
    const [assetClass, setAssetClass] = useState('')
    const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG')

    // Step 2 fields
    const [entryTime, setEntryTime] = useState(new Date())
    const [entryPrice, setEntryPrice] = useState('')
    const [accountId, setAccountId] = useState('')

    // Step 3 fields (exit - optional for open trades)
    const [exitTime, setExitTime] = useState(new Date())
    const [exitPrice, setExitPrice] = useState('')

    // Step 4 fields
    const [positionSize, setPositionSize] = useState('')
    const [stopLoss, setStopLoss] = useState('')
    const [takeProfit, setTakeProfit] = useState('')
    const [fees, setFees] = useState('0')

    // Step 5 fields
    const [strategyTags, setStrategyTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState('')
    const [session, setSession] = useState('')
    const [emotionalState, setEmotionalState] = useState('')
    const [rating, setRating] = useState(0)

    // Step 6 fields
    const [notes, setNotes] = useState('')

    // Images
    const [existingImages, setExistingImages] = useState<any[]>([])
    const [newImages, setNewImages] = useState<ImagePicker.ImagePickerAsset[]>([])
    const [removedImageIds, setRemovedImageIds] = useState<string[]>([])

    // Voice Notes
    const [existingVoiceNotes, setExistingVoiceNotes] = useState<any[]>([])
    const [newVoiceNotes, setNewVoiceNotes] = useState<any[]>([])
    const [removedVoiceNoteIds, setRemovedVoiceNoteIds] = useState<string[]>([])
    const [recording, setRecording] = useState<Audio.Recording | null>(null)
    const [isRecording, setIsRecording] = useState(false)

    // Date pickers
    const [showEntryPicker, setShowEntryPicker] = useState(false)
    const [entryPickerMode, setEntryPickerMode] = useState<'date' | 'time'>('date')
    const [showExitPicker, setShowExitPicker] = useState(false)
    const [exitPickerMode, setExitPickerMode] = useState<'date' | 'time'>('date')

    useEffect(() => {
        async function loadTrade() {
            if (!id) return

            const { data: trade, error } = await supabase
                .from('trades')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !trade) {
                Alert.alert('Error', 'Failed to load trade.')
                router.back()
                return
            }

            setOriginalTrade(trade)
            setInstrument(trade.instrument || '')
            setAssetClass(trade.asset_class || '')
            setDirection(trade.direction || 'LONG')
            setEntryTime(new Date(trade.entry_time))
            setEntryPrice(trade.entry_price?.toString() || '')
            setAccountId(trade.account_id || '')
            if (trade.exit_time) setExitTime(new Date(trade.exit_time))
            setExitPrice(trade.exit_price?.toString() || '')
            setPositionSize(trade.position_size?.toString() || '')
            setStopLoss(trade.stop_loss?.toString() || '')
            setTakeProfit(trade.take_profit?.toString() || '')
            setFees(trade.fees?.toString() || '0')
            setSession(trade.session || '')
            setEmotionalState(trade.emotional_state || '')
            setRating(trade.trade_rating || 0)
            setNotes(trade.notes || '')

            // Load tags
            const { data: tagsData } = await supabase
                .from('trade_tags')
                .select('*')
                .eq('trade_id', id)
            if (tagsData) {
                setStrategyTags(tagsData.filter(t => t.tag_type === 'STRATEGY').map(t => t.tag_value))
            }

            // Load images with signed URLs
            const { data: imgData } = await supabase
                .from('trade_images')
                .select('*')
                .eq('trade_id', id)

            if (imgData && imgData.length > 0) {
                const withUrls = await Promise.all(imgData.map(async (img) => {
                    const { data: urlData } = await supabase.storage
                        .from('trade_images')
                        .createSignedUrl(img.storage_key, 3600)
                    return { ...img, previewUrl: urlData?.signedUrl }
                }))
                setExistingImages(withUrls)
            }

            // Load voice notes
            const { data: vnData } = await supabase
                .from('trade_voice_notes')
                .select('*')
                .eq('trade_id', id)

            if (vnData && vnData.length > 0) {
                setExistingVoiceNotes(vnData)
            }

            setLoading(false)
        }

        loadTrade()
    }, [id])

    const onEntryDateChange = (event: any, selected?: Date) => {
        if (Platform.OS === 'android') setShowEntryPicker(false)
        if (selected) {
            setEntryTime(selected)
            if (Platform.OS === 'android' && entryPickerMode === 'date') {
                setEntryPickerMode('time')
                setShowEntryPicker(true)
            }
        }
    }

    const onExitDateChange = (event: any, selected?: Date) => {
        if (Platform.OS === 'android') setShowExitPicker(false)
        if (selected) {
            setExitTime(selected)
            if (Platform.OS === 'android' && exitPickerMode === 'date') {
                setExitPickerMode('time')
                setShowExitPicker(true)
            }
        }
    }

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
            base64: true,
        })
        if (!result.canceled) {
            setNewImages(prev => [...prev, result.assets[0]])
        }
    }

    const removeExistingImage = (imgId: string) => {
        setRemovedImageIds(prev => [...prev, imgId])
        setExistingImages(prev => prev.filter(i => i.id !== imgId))
    }

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index))
    }

    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync()
            if (permission.status !== 'granted') return
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
            setRecording(recording)
            setIsRecording(true)
        } catch (err) {
            console.error('Failed to start recording', err)
        }
    }

    async function stopRecording() {
        if (!recording) return
        setIsRecording(false)
        await recording.stopAndUnloadAsync()
        const uri = recording.getURI()
        const status = await recording.getStatusAsync()
        if (uri) {
            setNewVoiceNotes(prev => [...prev, { uri, duration: status.durationMillis, mimeType: 'audio/m4a' }])
        }
        setRecording(null)
    }

    const removeExistingVoiceNote = (vnId: string) => {
        setRemovedVoiceNoteIds(prev => [...prev, vnId])
        setExistingVoiceNotes(prev => prev.filter(v => v.id !== vnId))
    }

    const removeNewVoiceNote = (index: number) => {
        setNewVoiceNotes(prev => prev.filter((_, i) => i !== index))
    }

    const addTag = () => {
        const tag = newTag.trim().toUpperCase()
        if (tag && !strategyTags.includes(tag)) {
            setStrategyTags(prev => [...prev, tag])
        }
        setNewTag('')
    }

    const removeTag = (tag: string) => {
        setStrategyTags(prev => prev.filter(t => t !== tag))
    }

    const onSave = async () => {
        if (!user || !originalTrade) return

        if (!instrument.trim()) {
            Alert.alert('Required', 'Please enter an instrument.')
            return
        }
        if (!entryPrice) {
            Alert.alert('Required', 'Please enter an entry price.')
            return
        }

        setSaving(true)
        try {
            const entry = parseFloat(entryPrice) || 0
            const exit = parseFloat(exitPrice) || 0
            const pos = parseFloat(positionSize) || 0
            const feesNum = parseFloat(fees) || 0
            const isOpen = !exitPrice || exitPrice.trim() === ''

            let netPnl = null
            let grossPnl = null
            let outcome = null

            if (!isOpen && entry > 0 && pos > 0 && exit > 0) {
                const raw = direction === 'LONG' ? (exit - entry) * pos : (entry - exit) * pos
                grossPnl = raw
                netPnl = raw - feesNum
                if (netPnl > 0) outcome = 'WIN'
                else if (netPnl < 0) outcome = 'LOSS'
                else outcome = 'BREAK_EVEN'
            }

            const rrRatio = stopLoss && takeProfit
                ? Math.abs((parseFloat(takeProfit) - entry) / (entry - parseFloat(stopLoss)))
                : null

            const updatePayload: any = {
                instrument: instrument.toUpperCase(),
                asset_class: assetClass || null,
                direction,
                entry_time: entryTime.toISOString(),
                entry_price: entry,
                exit_time: !isOpen ? exitTime.toISOString() : null,
                exit_price: !isOpen ? exit : null,
                position_size: pos,
                stop_loss: stopLoss ? parseFloat(stopLoss) : null,
                take_profit: takeProfit ? parseFloat(takeProfit) : null,
                fees: feesNum,
                gross_pnl: grossPnl,
                net_pnl: netPnl,
                outcome,
                is_open: isOpen,
                session: session || null,
                emotional_state: emotionalState || null,
                notes: notes || null,
                trade_rating: rating || null,
                rr_ratio: rrRatio,
            }

            const { error: updateErr } = await supabase
                .from('trades')
                .update(updatePayload)
                .eq('id', originalTrade.id)

            if (updateErr) throw updateErr

            // Update strategy tags: delete all then re-insert
            await supabase.from('trade_tags').delete().eq('trade_id', originalTrade.id).eq('tag_type', 'STRATEGY')
            if (strategyTags.length > 0) {
                await supabase.from('trade_tags').insert(
                    strategyTags.map(tag => ({
                        trade_id: originalTrade.id,
                        user_id: user.id,
                        tag_type: 'STRATEGY',
                        tag_value: tag,
                    }))
                )
            }

            // Delete removed images
            for (const imgId of removedImageIds) {
                const img = existingImages.find(i => i.id === imgId) ||
                    (await supabase.from('trade_images').select('*').eq('id', imgId).single()).data
                if (img?.storage_key) {
                    await supabase.storage.from('trade_images').remove([img.storage_key])
                }
                await supabase.from('trade_images').delete().eq('id', imgId)
            }

            // Upload new images
            for (const img of newImages) {
                if (!img.base64) continue
                const fileExt = img.uri.split('.').pop() || 'jpg'
                const fileName = `${originalTrade.id}/${Date.now()}.${fileExt}`
                const { error: uploadErr } = await supabase.storage
                    .from('trade_images')
                    .upload(fileName, decode(img.base64), { contentType: `image/${fileExt}` })

                if (!uploadErr) {
                    await supabase.from('trade_images').insert({
                        trade_id: originalTrade.id,
                        user_id: user.id,
                        storage_key: fileName,
                        file_name: img.fileName || fileName,
                        file_size: img.fileSize,
                        mime_type: `image/${fileExt}`,
                    })
                }
            }

            // Delete removed voice notes
            for (const vnId of removedVoiceNoteIds) {
                const vn = (await supabase.from('trade_voice_notes').select('*').eq('id', vnId).single()).data
                if (vn?.storage_key) {
                    await supabase.storage.from('trade_voice_notes').remove([vn.storage_key])
                }
                await supabase.from('trade_voice_notes').delete().eq('id', vnId)
            }

            // Upload new voice notes
            for (const vn of newVoiceNotes) {
                const fileExt = vn.uri.split('.').pop() || 'm4a'
                const fileName = `${originalTrade.id}/${Date.now()}.${fileExt}`
                const base64 = await FileSystem.readAsStringAsync(vn.uri, { encoding: FileSystem.EncodingType.Base64 })

                const { error: uploadErr } = await supabase.storage
                    .from('trade_voice_notes')
                    .upload(fileName, decode(base64), { contentType: vn.mimeType || `audio/${fileExt}` })

                if (!uploadErr) {
                    const { data: vnData, error: vnInsErr } = await supabase.from('trade_voice_notes').insert({
                        trade_id: originalTrade.id,
                        user_id: user.id,
                        storage_key: fileName,
                        file_name: `Voice Note ${new Date().toLocaleTimeString()}`,
                        mime_type: vn.mimeType || `audio/${fileExt}`,
                        duration_seconds: Math.round(vn.duration / 1000)
                    }).select().single()

                    if (vnData && !vnInsErr) {
                        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/trades/${originalTrade.id}/voice-notes/${vnData.id}/transcribe`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                            }
                        }).catch(e => console.error('Transcription trigger failed', e))
                    }
                }
            }

            queryClient.invalidateQueries({ queryKey: tradeKeys.all })
            Alert.alert('Saved!', 'Trade updated successfully.', [
                { text: 'OK', onPress: () => router.back() }
            ])
        } catch (err: any) {
            console.error(err)
            Alert.alert('Error', err.message || 'Failed to update trade.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight, styles.center]}>
                <ActivityIndicator size="large" color="#16a24e" />
            </View>
        )
    }

    const isOpen = !exitPrice || exitPrice.trim() === ''
    const formatDt = (d: Date) => d.toLocaleString([], {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    })

    const c = isDark
        ? { text: '#f8fafc', sub: '#94a3b8', border: 'rgba(22,162,78,0.2)', surface: 'rgba(22,162,78,0.05)' }
        : { text: '#0f172a', sub: '#64748b', border: 'rgba(22,162,78,0.2)', surface: 'rgba(22,162,78,0.05)' }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
        >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: c.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <MaterialIcons name="close" size={28} color={c.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: c.text }]}>Edit Trade</Text>
                <TouchableOpacity
                    style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
                    onPress={onSave}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.saveHeaderBtnText}>Save</Text>
                    }
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                {/* ── Section: Instrument ── */}
                <SectionHeader title="Trade Definition" />
                <View style={styles.formBlock}>
                    <Field label="Instrument">
                        <TextInput
                            style={[styles.input, { color: c.text, borderColor: c.border }]}
                            value={instrument}
                            onChangeText={v => setInstrument(v.toUpperCase())}
                            placeholder="e.g. BTC/USDT"
                            placeholderTextColor={c.sub}
                            autoCapitalize="characters"
                        />
                    </Field>

                    <Field label="Asset Class">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                            {ASSET_CLASSES.map(ac => (
                                <TouchableOpacity
                                    key={ac}
                                    style={[styles.chip, assetClass === ac ? styles.chipActive : { borderColor: c.border, backgroundColor: c.surface }]}
                                    onPress={() => setAssetClass(ac)}
                                >
                                    <Text style={[styles.chipText, assetClass === ac && { color: '#fff' }]}>{ac}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Field>

                    <Field label="Direction">
                        <View style={styles.chipsRow}>
                            {(['LONG', 'SHORT'] as const).map(dir => (
                                <TouchableOpacity
                                    key={dir}
                                    style={[
                                        styles.chip,
                                        direction === dir
                                            ? { backgroundColor: dir === 'LONG' ? '#16a24e' : '#ef4444', borderColor: 'transparent' }
                                            : { borderColor: c.border, backgroundColor: c.surface }
                                    ]}
                                    onPress={() => setDirection(dir)}
                                >
                                    <Text style={[styles.chipText, direction === dir && { color: '#fff' }]}>
                                        {dir === 'LONG' ? '↑ LONG' : '↓ SHORT'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Field>
                </View>

                {/* ── Section: Entry ── */}
                <SectionHeader title="Entry Details" />
                <View style={styles.formBlock}>
                    <Field label="Entry Date & Time">
                        <TouchableOpacity
                            style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.surface }]}
                            onPress={() => { setEntryPickerMode('date'); setShowEntryPicker(true) }}
                        >
                            <Text style={[styles.inputRowText, { color: c.text }]}>{formatDt(entryTime)}</Text>
                            <MaterialIcons name="calendar-today" size={20} color="#16a24e" />
                        </TouchableOpacity>
                        {showEntryPicker && (
                            <DateTimePicker
                                value={entryTime}
                                mode={entryPickerMode}
                                is24Hour
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onEntryDateChange}
                                themeVariant={isDark ? 'dark' : 'light'}
                            />
                        )}
                        {Platform.OS === 'ios' && showEntryPicker && (
                            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowEntryPicker(false)}>
                                <Text style={styles.doneBtnText}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </Field>

                    <View style={styles.row2}>
                        <View style={{ flex: 1 }}>
                            <Field label="Entry Price">
                                <TextInput
                                    style={[styles.input, { color: c.text, borderColor: c.border }]}
                                    value={entryPrice}
                                    onChangeText={setEntryPrice}
                                    placeholder="0.00"
                                    placeholderTextColor={c.sub}
                                    keyboardType="decimal-pad"
                                />
                            </Field>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field label="Position Size">
                                <TextInput
                                    style={[styles.input, { color: c.text, borderColor: c.border }]}
                                    value={positionSize}
                                    onChangeText={setPositionSize}
                                    placeholder="Units"
                                    placeholderTextColor={c.sub}
                                    keyboardType="decimal-pad"
                                />
                            </Field>
                        </View>
                    </View>

                    <View style={styles.row2}>
                        <View style={{ flex: 1 }}>
                            <Field label="Stop Loss">
                                <TextInput
                                    style={[styles.input, { color: c.text, borderColor: c.border }]}
                                    value={stopLoss}
                                    onChangeText={setStopLoss}
                                    placeholder="0.00"
                                    placeholderTextColor={c.sub}
                                    keyboardType="decimal-pad"
                                />
                            </Field>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Field label="Take Profit">
                                <TextInput
                                    style={[styles.input, { color: c.text, borderColor: c.border }]}
                                    value={takeProfit}
                                    onChangeText={setTakeProfit}
                                    placeholder="0.00"
                                    placeholderTextColor={c.sub}
                                    keyboardType="decimal-pad"
                                />
                            </Field>
                        </View>
                    </View>

                    <Field label="Fees">
                        <TextInput
                            style={[styles.input, { color: c.text, borderColor: c.border }]}
                            value={fees}
                            onChangeText={setFees}
                            placeholder="0.00"
                            placeholderTextColor={c.sub}
                            keyboardType="decimal-pad"
                        />
                    </Field>
                </View>

                {/* ── Section: Exit (only for closed trades) ── */}
                <SectionHeader title={isOpen ? 'Exit Details (Open Trade)' : 'Exit Details'} />
                <View style={styles.formBlock}>
                    <Text style={[styles.openNote, { color: c.sub }]}>
                        {isOpen
                            ? 'Leave exit price blank to keep this trade open. Fill in to close it.'
                            : 'Update exit info to recalculate P&L.'}
                    </Text>

                    <Field label="Exit Date & Time">
                        <TouchableOpacity
                            style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.surface }]}
                            onPress={() => { setExitPickerMode('date'); setShowExitPicker(true) }}
                        >
                            <Text style={[styles.inputRowText, { color: c.text }]}>{formatDt(exitTime)}</Text>
                            <MaterialIcons name="calendar-today" size={20} color="#16a24e" />
                        </TouchableOpacity>
                        {showExitPicker && (
                            <DateTimePicker
                                value={exitTime}
                                mode={exitPickerMode}
                                is24Hour
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onExitDateChange}
                                themeVariant={isDark ? 'dark' : 'light'}
                            />
                        )}
                        {Platform.OS === 'ios' && showExitPicker && (
                            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowExitPicker(false)}>
                                <Text style={styles.doneBtnText}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </Field>

                    <Field label="Exit Price (blank = keep open)">
                        <TextInput
                            style={[styles.input, { color: c.text, borderColor: c.border }]}
                            value={exitPrice}
                            onChangeText={setExitPrice}
                            placeholder="0.00"
                            placeholderTextColor={c.sub}
                            keyboardType="decimal-pad"
                        />
                    </Field>
                </View>

                {/* ── Section: Classification ── */}
                <SectionHeader title="Classification" />
                <View style={styles.formBlock}>
                    <Field label="Strategy Tags">
                        <View style={styles.tagWrap}>
                            {strategyTags.map(tag => (
                                <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => removeTag(tag)}>
                                    <Text style={styles.tagChipText}>{tag}</Text>
                                    <MaterialIcons name="close" size={12} color="#16a24e" />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.inputRow2}>
                            <TextInput
                                style={[styles.input, { flex: 1, color: c.text, borderColor: c.border }]}
                                value={newTag}
                                onChangeText={setNewTag}
                                placeholder="Add a tag…"
                                placeholderTextColor={c.sub}
                                onSubmitEditing={addTag}
                                returnKeyType="done"
                            />
                            <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
                                <MaterialIcons name="add" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Field>

                    <Field label="Session">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                            {SESSIONS.map(s => (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.chip, session === s ? styles.chipActive : { borderColor: c.border, backgroundColor: c.surface }]}
                                    onPress={() => setSession(session === s ? '' : s)}
                                >
                                    <Text style={[styles.chipText, session === s && { color: '#fff' }]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Field>

                    <Field label="Emotional State">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                            {EMOTIONAL_STATES.map(e => (
                                <TouchableOpacity
                                    key={e}
                                    style={[styles.chip, emotionalState === e ? styles.chipActive : { borderColor: c.border, backgroundColor: c.surface }]}
                                    onPress={() => setEmotionalState(emotionalState === e ? '' : e)}
                                >
                                    <Text style={[styles.chipText, emotionalState === e && { color: '#fff' }]}>{e}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Field>

                    <Field label="Trade Rating">
                        <View style={styles.starRow}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <TouchableOpacity key={i} onPress={() => setRating(i === rating ? 0 : i)}>
                                    <MaterialIcons
                                        name="star"
                                        size={36}
                                        color={i <= rating ? '#16a24e' : (isDark ? '#334155' : '#cbd5e1')}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Field>
                </View>

                {/* ── Section: Notes ── */}
                <SectionHeader title="Notes & Rationale" />
                <View style={styles.formBlock}>
                    <TextInput
                        style={[styles.textArea, { color: c.text, borderColor: c.border, backgroundColor: c.surface }]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Entry/exit rationale, observations…"
                        placeholderTextColor={c.sub}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* ── Section: Voice Rationale ── */}
                <SectionHeader title="Voice Rationale" />
                <View style={styles.formBlock}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {/* Existing voice notes */}
                        {existingVoiceNotes.map(vn => (
                            <View key={vn.id} style={styles.voiceNoteBox}>
                                <MaterialIcons name="mic" size={24} color="#16a24e" />
                                <Text style={styles.voiceNoteText}>{vn.duration_seconds}s</Text>
                                <TouchableOpacity style={styles.imgRemoveBtn} onPress={() => removeExistingVoiceNote(vn.id)}>
                                    <MaterialIcons name="delete" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {/* New voice notes */}
                        {newVoiceNotes.map((vn, idx) => (
                            <View key={`new-vn-${idx}`} style={styles.voiceNoteBox}>
                                <MaterialIcons name="mic" size={24} color="#16a24e" />
                                <Text style={styles.voiceNoteText}>{Math.round(vn.duration / 1000)}s</Text>
                                <TouchableOpacity style={styles.imgRemoveBtn} onPress={() => removeNewVoiceNote(idx)}>
                                    <MaterialIcons name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
                            </View>
                        ))}
                        {/* Record button */}
                        <TouchableOpacity
                            style={[styles.addImgBtn, isRecording && { borderColor: '#ef4444' }]}
                            onPress={isRecording ? stopRecording : startRecording}
                        >
                            <MaterialIcons
                                name={isRecording ? "stop" : "mic"}
                                size={28}
                                color={isRecording ? "#ef4444" : "#16a24e"}
                            />
                            <Text style={[styles.addImgText, isRecording && { color: '#ef4444' }]}>
                                {isRecording ? "Stop" : "Record"}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* ── Section: Screenshots ── */}
                <SectionHeader title="Screenshots" />
                <View style={styles.formBlock}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {/* Existing images */}
                        {existingImages.map(img => (
                            <View key={img.id} style={styles.imgBox}>
                                <Image source={{ uri: img.previewUrl }} style={styles.imgEl} resizeMode="cover" />
                                <TouchableOpacity style={styles.imgRemoveBtn} onPress={() => removeExistingImage(img.id)}>
                                    <MaterialIcons name="delete" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {/* New images */}
                        {newImages.map((img, idx) => (
                            <View key={`new-${idx}`} style={styles.imgBox}>
                                <Image source={{ uri: img.uri }} style={styles.imgEl} resizeMode="cover" />
                                <TouchableOpacity style={styles.imgRemoveBtn} onPress={() => removeNewImage(idx)}>
                                    <MaterialIcons name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
                            </View>
                        ))}
                        {/* Add button */}
                        <TouchableOpacity style={styles.addImgBtn} onPress={pickImage}>
                            <MaterialIcons name="add-photo-alternate" size={28} color="#16a24e" />
                            <Text style={styles.addImgText}>Add</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Bottom save button */}
                <TouchableOpacity
                    style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
                    onPress={onSave}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <MaterialIcons name="check-circle" size={22} color="#fff" />
                            <Text style={styles.primaryBtnText}>Save Changes</Text>
                        </>
                    }
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
            <View style={styles.sectionDivider} />
        </View>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            {children}
        </View>
    )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    bgLight: { backgroundColor: '#f6f8f7' },
    bgDark: { backgroundColor: '#0a0f0c' },
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 24,
        borderBottomWidth: 1,
    },
    iconBtn: { padding: 4 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
    saveHeaderBtn: {
        backgroundColor: '#16a24e',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveHeaderBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    scrollContent: { paddingBottom: 80 },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingBottom: 8,
    },
    sectionHeaderText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        color: '#16a24e',
        flexShrink: 0,
    },
    sectionDivider: { flex: 1, height: 1, backgroundColor: 'rgba(22,162,78,0.2)' },

    formBlock: { paddingHorizontal: 24, paddingBottom: 8, gap: 16 },
    field: { gap: 8 },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#64748b',
    },
    openNote: { fontSize: 13, fontStyle: 'italic', marginBottom: 4 },

    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: 'rgba(22,162,78,0.05)',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    inputRowText: { flex: 1, fontSize: 16 },

    row2: { flexDirection: 'row', gap: 12 },

    chipsRow: { flexDirection: 'row', gap: 8 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    chipActive: { backgroundColor: '#16a24e', borderColor: '#16a24e' },
    chipText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },

    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(22,162,78,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(22,162,78,0.3)',
    },
    tagChipText: { fontSize: 11, fontWeight: 'bold', color: '#16a24e' },

    inputRow2: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addTagBtn: {
        backgroundColor: '#16a24e',
        borderRadius: 10,
        padding: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    starRow: { flexDirection: 'row', gap: 4 },

    textArea: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        minHeight: 140,
        fontSize: 16,
        lineHeight: 24,
    },

    voiceNoteBox: {
        width: 112,
        height: 112,
        borderRadius: 10,
        backgroundColor: 'rgba(22, 162, 78, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(22, 162, 78, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        position: 'relative',
    },
    voiceNoteText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#16a24e',
    },

    imgBox: {
        width: 112,
        height: 112,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#121d16',
    },
    imgEl: { width: '100%', height: '100%' },
    imgRemoveBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        padding: 4,
    },
    newBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: '#16a24e',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    newBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#fff' },
    addImgBtn: {
        width: 112,
        height: 112,
        borderRadius: 10,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(22,162,78,0.3)',
        backgroundColor: 'rgba(22,162,78,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    addImgText: { fontSize: 12, color: '#64748b' },

    primaryBtn: {
        margin: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#16a24e',
        paddingVertical: 18,
        borderRadius: 12,
    },
    primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

    doneBtn: {
        alignSelf: 'flex-end',
        marginTop: 6,
        paddingHorizontal: 14,
        paddingVertical: 7,
        backgroundColor: '#16a24e',
        borderRadius: 8,
    },
    doneBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
})

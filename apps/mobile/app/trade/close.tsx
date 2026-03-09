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

export default function CloseTradeScreen() {
    const { id } = useLocalSearchParams()
    const isDark = useColorScheme() === 'dark'
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    const [trade, setTrade] = useState<any>(null)
    const [loadingTrade, setLoadingTrade] = useState(true)
    const [saving, setSaving] = useState(false)

    const [exitPrice, setExitPrice] = useState('')
    const [exitTime, setExitTime] = useState(new Date().toISOString())
    const [fees, setFees] = useState('0')
    const [exitNotes, setExitNotes] = useState('')
    const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([])

    const [showPicker, setShowPicker] = useState(false)
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date')

    useEffect(() => {
        async function fetchTrade() {
            if (!id) return
            const { data, error } = await supabase.from('trades').select('*').eq('id', id).single()
            if (!error && data) {
                setTrade(data)
                if (data.fees) setFees(data.fees.toString())
            }
            setLoadingTrade(false)
        }
        fetchTrade()
    }, [id])

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowPicker(false)
        if (selectedDate) {
            setExitTime(selectedDate.toISOString())
            if (Platform.OS === 'android' && pickerMode === 'date') {
                setPickerMode('time')
                setShowPicker(true)
            }
        }
    }

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
            base64: true,
        })
        if (!result.canceled) {
            setImages([...images, result.assets[0]])
        }
    }

    const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index))

    const onSave = async () => {
        if (!user || !trade) return
        if (!exitPrice) {
            Alert.alert('Required', 'Please enter an exit price to close the trade.')
            return
        }

        setSaving(true)
        try {
            const entry = parseFloat(trade.entry_price)
            const exit = parseFloat(exitPrice)
            const pos = parseFloat(trade.position_size)
            const additionalFees = parseFloat(fees) || 0

            let outcome = 'BREAK_EVEN'
            let netPnl = 0

            if (entry > 0 && pos > 0 && exit > 0) {
                const units = pos
                netPnl = (trade.direction === 'LONG') ? (exit - entry) * units : (entry - exit) * units
                netPnl -= additionalFees

                if (netPnl > 0) outcome = 'WIN'
                else if (netPnl < 0) outcome = 'LOSS'
            }

            // Append notes
            const finalNotes = trade.notes
                ? `${trade.notes}\n\n--- EXIT RATIONALE ---\n${exitNotes}`
                : `--- EXIT RATIONALE ---\n${exitNotes}`

            const payload = {
                exit_time: exitTime,
                exit_price: exit,
                fees: additionalFees,
                gross_pnl: netPnl + additionalFees,
                net_pnl: netPnl,
                outcome: outcome,
                is_open: false,
                notes: finalNotes
            }

            const { error: updateErr } = await supabase.from('trades').update(payload).eq('id', trade.id)
            if (updateErr) throw updateErr

            // Upload screenshots specifically for exit
            if (images.length > 0) {
                for (const img of images) {
                    if (!img.base64) continue
                    const fileExt = img.uri.split('.').pop() || 'jpg'
                    const fileName = `${trade.id}/exit_${Date.now()}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('trade_images')
                        .upload(fileName, decode(img.base64), { contentType: `image/${fileExt}` })

                    if (!uploadError) {
                        await supabase.from('trade_images').insert({
                            trade_id: trade.id,
                            user_id: user.id,
                            storage_key: fileName,
                            file_name: img.fileName || fileName,
                            file_size: img.fileSize,
                            mime_type: `image/${fileExt}`
                        })
                    }
                }
            }

            queryClient.invalidateQueries({ queryKey: tradeKeys.all })
            router.back()
        } catch (err: any) {
            console.error(err)
            Alert.alert('Error', err.message || 'Failed to close trade.')
        } finally {
            setSaving(false)
        }
    }

    if (loadingTrade) {
        return (
            <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#16a24e" />
            </View>
        )
    }

    if (!trade) {
        return (
            <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>Trade not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, padding: 12, backgroundColor: '#16a24e', borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const formattedDate = new Date(exitTime).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
            <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <MaterialIcons name="close" size={28} color={isDark ? '#f8fafc' : '#0f172a'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Close Trade</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.titleSection}>
                    <Text style={[styles.mainTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{trade.instrument}</Text>
                    <Text style={[styles.subTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Enter final exit details to close this position.</Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.field}>
                        <Text style={[styles.label, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Exit Date & Time</Text>
                        <TouchableOpacity style={styles.inputContainer} onPress={() => { setPickerMode('date'); setShowPicker(true) }}>
                            <Text style={[styles.input, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{formattedDate}</Text>
                            <MaterialIcons name="calendar-today" size={24} color="rgba(22, 162, 78, 0.6)" />
                        </TouchableOpacity>
                        {showPicker && (
                            <DateTimePicker value={new Date(exitTime)} mode={pickerMode} is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} themeVariant={isDark ? 'dark' : 'light'} maximumDate={new Date()} />
                        )}
                        {Platform.OS === 'ios' && showPicker && (
                            <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 8, marginTop: 4, backgroundColor: '#16a24e', borderRadius: 8 }} onPress={() => setShowPicker(false)}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Exit Price</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.inputLarge, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                                placeholder="0.00"
                                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                                keyboardType="decimal-pad"
                                value={exitPrice}
                                onChangeText={setExitPrice}
                            />
                            <MaterialIcons name="payments" size={24} color="rgba(22, 162, 78, 0.6)" />
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Total Fees</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                                placeholder="0.00"
                                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                                keyboardType="decimal-pad"
                                value={fees}
                                onChangeText={setFees}
                            />
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Exit Rationale</Text>
                        <TextInput
                            style={[styles.textArea, { color: isDark ? '#f8fafc' : '#0f172a' }, isDark ? styles.borderDark : styles.borderLight]}
                            placeholder="Why are you closing this trade now?"
                            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                            multiline
                            textAlignVertical="top"
                            value={exitNotes}
                            onChangeText={setExitNotes}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Exit Screenshots</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                            {images.map((img, index) => (
                                <View key={index} style={styles.imgPreviewBox}>
                                    <Image source={{ uri: img.uri }} style={styles.imgPreview} />
                                    <TouchableOpacity style={styles.imgRemoveBtn} onPress={() => removeImage(index)}>
                                        <MaterialIcons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.uploadBoxSmall} onPress={pickImage}>
                                <MaterialIcons name="add-photo-alternate" size={28} color="#16a24e" style={{ marginBottom: 4 }} />
                                <Text style={styles.uploadTextSmall}>Add</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={onSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : (
                        <>
                            <MaterialIcons name="done-all" size={20} color="#fff" />
                            <Text style={styles.primaryBtnText}>Confirm & Close Trade</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    bgLight: { backgroundColor: '#f6f8f7' },
    bgDark: { backgroundColor: '#112117' },
    borderLight: { borderColor: 'rgba(22, 162, 78, 0.2)' },
    borderDark: { borderColor: 'rgba(22, 162, 78, 0.2)' },

    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'ios' ? 64 : 24, borderBottomWidth: 1, justifyContent: 'space-between' },
    iconBtn: { padding: 4 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
    headerSpacer: { width: 40 },

    scrollContent: { paddingBottom: 60 },
    titleSection: { paddingHorizontal: 24, marginVertical: 24 },
    mainTitle: { fontSize: 32, fontWeight: 'bold' },
    subTitle: { fontSize: 16, marginTop: 4 },

    formSection: { paddingHorizontal: 24, gap: 24, marginBottom: 48 },
    field: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(22, 162, 78, 0.05)', borderWidth: 1, borderColor: 'rgba(22, 162, 78, 0.2)', borderRadius: 12, paddingHorizontal: 16 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16 },
    inputLarge: { flex: 1, paddingVertical: 16, fontSize: 20, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' },

    textArea: { borderWidth: 1, borderRadius: 12, padding: 16, minHeight: 120, fontSize: 16, backgroundColor: 'rgba(22, 162, 78, 0.05)' },

    uploadBoxSmall: { width: 100, height: 100, borderWidth: 2, borderColor: 'rgba(22, 162, 78, 0.3)', borderRadius: 8, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(22, 162, 78, 0.05)' },
    uploadTextSmall: { fontSize: 12, fontWeight: '500', color: '#64748b' },
    imgPreviewBox: { position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(22, 162, 78, 0.2)' },
    imgPreview: { width: '100%', height: '100%' },
    imgRemoveBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 },

    primaryBtn: { marginHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#16a24e', paddingVertical: 20, borderRadius: 12, shadowColor: '#16a24e', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})

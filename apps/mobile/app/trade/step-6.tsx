import React, { useState } from 'react'
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
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useTradeFormStore } from '../../src/stores/trade-form.store'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/auth.store'
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'

export default function NewTradeStep6() {
    const isDark = useColorScheme() === 'dark'
    const store = useTradeFormStore()
    const { user } = useAuthStore()

    const [saving, setSaving] = useState(false)
    const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([])

    // Calcs for preview
    const entry = parseFloat(store.entryPrice) || 0
    const exit = parseFloat(store.exitPrice) || 0
    const pos = parseFloat(store.positionSize) || 0

    let netPnl = 0
    if (entry > 0 && pos > 0 && exit > 0) {
        const units = pos / entry
        netPnl = (store.direction === 'LONG') ? (exit - entry) * units : (entry - exit) * units
    }

    const pnlDisplay = netPnl === 0 ? '—' : `${netPnl >= 0 ? '+' : '-'}$${Math.abs(netPnl).toFixed(2)}`
    const pnlColor = netPnl === 0 ? '#64748b' : (netPnl > 0 ? '#16a24e' : '#ef4444')

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

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index))
    }

    const onSave = async () => {
        if (!user) return
        setSaving(true)

        try {
            // Determine Outcome
            let outcome = null
            if (store.exitPrice) {
                if (netPnl > 0) outcome = 'WIN'
                else if (netPnl < 0) outcome = 'LOSS'
                else outcome = 'BREAK_EVEN'
            }

            // Calculate gross / prep fields
            const units = entry > 0 ? (pos / entry) : 0
            const fees = parseFloat(store.fees) || 0
            const netFinal = netPnl - fees
            const grossFinal = netPnl // simplistic assumption

            const payload = {
                user_id: user.id,
                account_id: store.accountId,
                instrument: store.instrument,
                asset_class: store.assetClass,
                direction: store.direction,
                entry_time: store.entryTime || new Date().toISOString(),
                exit_time: store.exitTime || null,
                entry_price: parseFloat(store.entryPrice) || null,
                exit_price: parseFloat(store.exitPrice) || null,
                position_size: parseFloat(store.positionSize) || null,
                stop_loss: parseFloat(store.stopLoss) || null,
                take_profit: parseFloat(store.takeProfit) || null,
                fees: fees,
                gross_pnl: store.exitPrice ? grossFinal : null,
                net_pnl: store.exitPrice ? netFinal : null,
                outcome: outcome,
                session: store.sessionFocus || null,
                emotional_state: store.emotionalState || null,
                notes: store.notes || null,
                trade_rating: store.rating || null,
                is_open: !store.exitPrice,
                is_draft: false,
            }

            const { data: tradeData, error: tradeErr } = await supabase.from('trades').insert(payload).select().single()
            if (tradeErr) throw tradeErr

            // Insert Strategy Tags
            if (store.strategyTags && store.strategyTags.length > 0 && tradeData) {
                const tagPayloads = store.strategyTags.map((tag) => ({
                    trade_id: tradeData.id,
                    user_id: user.id,
                    tag_type: 'STRATEGY',
                    tag_value: tag,
                }))
                const { error: tagsErr } = await supabase.from('trade_tags').insert(tagPayloads)
                if (tagsErr) console.warn('Failed to insert tags:', tagsErr)
            }

            if (images.length > 0 && tradeData) {
                for (const img of images) {
                    if (!img.base64) continue
                    const fileExt = img.uri.split('.').pop() || 'jpg'
                    const fileName = `${tradeData.id}/${Date.now()}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('trade_images')
                        .upload(fileName, decode(img.base64), {
                            contentType: `image/${fileExt}`
                        })

                    if (!uploadError) {
                        await supabase.from('trade_images').insert({
                            trade_id: tradeData.id,
                            user_id: user.id,
                            storage_key: fileName,
                            file_name: img.fileName || fileName,
                            file_size: img.fileSize,
                            mime_type: `image/${fileExt}`
                        })
                    }
                }
            }

            store.reset()
            router.replace('/(tabs)/trades')
        } catch (err: any) {
            console.error(err)
            Alert.alert('Error', err.message || 'Failed to save trade.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
        >
            <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight, { backgroundColor: isDark ? 'rgba(17,33,23,0.8)' : 'rgba(246,248,247,0.8)' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>New Trade</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.progressSection}>
                    <View style={styles.progressTop}>
                        <Text style={styles.stepLabel}>Final Review</Text>
                        <Text style={styles.stepCount}>Step 6 of 6</Text>
                    </View>
                    <View style={[styles.progressBarBg, isDark ? styles.progressBgDark : styles.progressBgLight]}>
                        <View style={[styles.progressBarFill, { width: '100%' }]} />
                    </View>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.field}>
                        <Text style={styles.label}>Trade Rationale</Text>
                        <TextInput
                            style={[styles.textArea, { color: isDark ? '#f8fafc' : '#0f172a' }, isDark ? styles.borderDark : styles.borderLight]}
                            placeholder="Add your trade rationale..."
                            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                            multiline
                            textAlignVertical="top"
                            value={store.notes}
                            onChangeText={(val) => store.updateField('notes', val)}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Screenshots</Text>
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

                    <View style={styles.field}>
                        <Text style={styles.label}>Outcome Preview</Text>
                        <View style={styles.gridPreview}>
                            <View style={[styles.previewCard, isDark ? styles.borderDark : styles.borderLight]}>
                                <Text style={styles.previewLabel}>Estimated Net P&L</Text>
                                <Text style={[styles.previewVal, { color: pnlColor }]}>{pnlDisplay}</Text>
                            </View>
                            <View style={[styles.previewCard, isDark ? styles.borderDark : styles.borderLight]}>
                                <Text style={styles.previewLabel}>Direction</Text>
                                <Text style={[styles.previewVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{store.direction}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, isDark ? styles.borderDark : styles.borderLight, { backgroundColor: isDark ? '#112117' : '#f6f8f7' }]}>
                <TouchableOpacity style={styles.btnPrimary} onPress={onSave} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialIcons name="check-circle" size={24} color="#fff" />
                            <Text style={styles.btnPrimaryText}>Save Trade</Text>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.footerNote}>ALL ENTRIES ARE FINAL AFTER SAVING</Text>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    bgLight: { backgroundColor: '#f6f8f7' },
    bgDark: { backgroundColor: '#112117' },
    borderLight: { borderColor: 'rgba(22, 162, 78, 0.2)' },
    borderDark: { borderColor: 'rgba(22, 162, 78, 0.2)' },
    progressBgLight: { backgroundColor: 'rgba(22, 162, 78, 0.1)' },
    progressBgDark: { backgroundColor: 'rgba(22, 162, 78, 0.1)' },

    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'ios' ? 64 : 24, borderBottomWidth: 1, justifyContent: 'space-between', zIndex: 10 },
    iconBtn: { padding: 4 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
    headerSpacer: { width: 40 },

    scrollContent: { paddingBottom: 160 },

    progressSection: { paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stepLabel: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    stepCount: { fontSize: 13, fontWeight: 'bold', color: '#16a24e', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#16a24e' },

    formSection: { paddingHorizontal: 24, gap: 32, marginTop: 16 },
    field: { gap: 12 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },

    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        minHeight: 160,
        fontSize: 16,
        lineHeight: 24,
        backgroundColor: 'rgba(22, 162, 78, 0.05)',
    },

    uploadBox: {
        minHeight: 120,
        borderWidth: 2,
        borderColor: 'rgba(22, 162, 78, 0.3)',
        borderRadius: 12,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(22, 162, 78, 0.05)',
    },
    uploadText: { fontSize: 14, fontWeight: '500', color: '#64748b' },

    uploadBoxSmall: {
        width: 100,
        height: 100,
        borderWidth: 2,
        borderColor: 'rgba(22, 162, 78, 0.3)',
        borderRadius: 8,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(22, 162, 78, 0.05)',
    },
    uploadTextSmall: { fontSize: 12, fontWeight: '500', color: '#64748b' },

    imgPreviewBox: { position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(22, 162, 78, 0.2)' },
    imgPreview: { width: '100%', height: '100%' },
    imgRemoveBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 },

    gridPreview: { flexDirection: 'row', gap: 16 },
    previewCard: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: 'rgba(22, 162, 78, 0.05)', borderWidth: 1, gap: 8 },
    previewLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', letterSpacing: 1 },
    previewVal: { fontSize: 24, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 24, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    btnPrimary: { backgroundColor: '#16a24e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 12 },
    btnPrimaryText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: -0.5 },
    footerNote: { textAlign: 'center', fontSize: 10, color: '#64748b', marginTop: 16, textTransform: 'uppercase', letterSpacing: 2 },
})

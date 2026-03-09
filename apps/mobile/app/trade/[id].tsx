import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    Platform,
    ActivityIndicator,
    ScrollView,
    Image,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '../../src/lib/supabase'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function TradeDetailScreen() {
    const { id } = useLocalSearchParams()
    const isDark = useColorScheme() === 'dark'

    const [trade, setTrade] = useState<any>(null)
    const [tags, setTags] = useState<any[]>([])
    const [images, setImages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadTradeData() {
            if (!id) return

            const { data: tradeData, error: tradeErr } = await supabase
                .from('trades')
                .select('*')
                .eq('id', id)
                .single()

            if (tradeData) {
                setTrade(tradeData)

                const { data: tagsData } = await supabase
                    .from('trade_tags')
                    .select('*')
                    .eq('trade_id', id)
                if (tagsData) setTags(tagsData)

                const { data: imgData } = await supabase
                    .from('trade_images')
                    .select('*')
                    .eq('trade_id', id)

                if (imgData && imgData.length > 0) {
                    const formattedImages = await Promise.all(
                        imgData.map(async (img) => {
                            const { data: urlData } = await supabase.storage
                                .from('trade_images')
                                .createSignedUrl(img.storage_key, 3600) // 1 hr expiry
                            return { ...img, url: urlData?.signedUrl }
                        })
                    )
                    setImages(formattedImages)
                }
            }
            setLoading(false)
        }

        loadTradeData()
    }, [id])

    if (loading) {
        return (
            <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight, styles.center]}>
                <ActivityIndicator size="large" color="#16a24e" />
            </View>
        )
    }

    if (!trade) {
        return (
            <View style={[styles.container, isDark ? styles.bgDark : styles.bgLight, styles.center]}>
                <Text style={[styles.errorText, isDark ? styles.textDark : styles.textLight]}>Trade not found.</Text>
                <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
                    <Text style={styles.errorBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const pnlNum = parseFloat(trade.net_pnl) || 0
    const isPending = trade.is_open

    let pnlStr = `$0.00`
    let pnlColor = isDark ? styles.textDark.color : styles.textLight.color

    if (!isPending && pnlNum !== 0) {
        pnlStr = `${pnlNum > 0 ? '+' : '-'}$${Math.abs(pnlNum).toFixed(2)}`
        pnlColor = pnlNum > 0 ? '#16a24e' : '#ef4444'
    }

    const badgeOutcome = isPending ? 'PENDING' : (trade.outcome === 'BREAK_EVEN' ? 'BE' : (trade.outcome || 'N/A'))

    const entryDateRaw = new Date(trade.entry_time)
    const exitDateRaw = trade.exit_time ? new Date(trade.exit_time) : null

    const formatDateTime = (d: Date) => d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    // Determine durations
    let durationStr = '—'
    if (exitDateRaw) {
        const diffMins = Math.round((exitDateRaw.getTime() - entryDateRaw.getTime()) / 60000)
        const h = Math.floor(diffMins / 60)
        const m = diffMins % 60
        durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`
    } else {
        const activeMins = Math.round((new Date().getTime() - entryDateRaw.getTime()) / 60000)
        const h = Math.floor(activeMins / 60)
        const m = activeMins % 60
        durationStr = h > 0 ? `${h}h ${m}m active` : `${m}m active`
    }

    const strategyTags = tags.filter(t => t.tag_type === 'STRATEGY').map(t => t.tag_value)

    return (
        <SafeAreaView style={[styles.container, isDark ? styles.bgDark : styles.bgLight]} edges={['top']}>

            {/* Top Navbar */}
            <View style={[styles.navbar, isDark ? styles.borderDark : styles.borderLight]}>
                <View style={styles.navLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <MaterialIcons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
                    </TouchableOpacity>
                    <View style={styles.navTitleBox}>
                        <Text style={[styles.navTitle, isDark ? styles.textDark : styles.textLight]}>{trade.instrument}</Text>
                        <Text style={styles.navSubtitle}>ID: #{trade.id.substring(0, 8).toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.badgeWrapper}>
                    <Text style={styles.badgeText}>{badgeOutcome}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Hero PNL */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroLabel}>Net P&L</Text>
                    <Text style={[styles.heroVal, { color: pnlColor }]}>{isPending ? 'PENDING' : pnlStr}</Text>
                </View>

                {/* Action required if Pending */}
                {isPending && (
                    <TouchableOpacity
                        style={styles.closeActionBtn}
                        onPress={() => router.push({ pathname: '/trade/close', params: { id: trade.id } } as any)}
                    >
                        <Text style={styles.closeActionBtnText}>Close Open Position</Text>
                        <MaterialIcons name="exit-to-app" size={20} color="#fff" />
                    </TouchableOpacity>
                )}

                {/* Key Metrics Grid */}
                <View style={[styles.gridBox, isDark ? styles.borderDark : styles.borderLight]}>
                    <View style={[styles.gridItem, isDark ? styles.gridItemDark : styles.gridItemLight, styles.gridBorderRight, styles.gridBorderBottom]}>
                        <Text style={styles.gridLabel}>Entry</Text>
                        <Text style={[styles.gridVal, isDark ? styles.textDark : styles.textLight]}>${parseFloat(trade.entry_price || '0').toFixed(2)}</Text>
                    </View>
                    <View style={[styles.gridItem, isDark ? styles.gridItemDark : styles.gridItemLight, styles.gridBorderBottom]}>
                        <Text style={styles.gridLabel}>Exit</Text>
                        <Text style={[styles.gridVal, isDark ? styles.textDark : styles.textLight]}>
                            {trade.exit_price ? `$${parseFloat(trade.exit_price).toFixed(2)}` : '—'}
                        </Text>
                    </View>
                    <View style={[styles.gridItem, isDark ? styles.gridItemDark : styles.gridItemLight, styles.gridBorderRight]}>
                        <Text style={styles.gridLabel}>Size</Text>
                        <Text style={[styles.gridVal, isDark ? styles.textDark : styles.textLight]}>{trade.position_size}</Text>
                    </View>
                    <View style={[styles.gridItem, isDark ? styles.gridItemDark : styles.gridItemLight]}>
                        <Text style={styles.gridLabel}>R:R</Text>
                        <Text style={[styles.gridVal, isDark ? styles.textDark : styles.textLight]}>{trade.rr_ratio ? `1:${parseFloat(trade.rr_ratio).toFixed(1)}` : '—'}</Text>
                    </View>
                </View>

                {/* Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                    <View style={styles.timelineRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.timelineDate, isDark ? styles.textDark : styles.textLight]}>{formatDateTime(entryDateRaw)}</Text>
                            <Text style={styles.timelineLabel}>Entry Date</Text>
                        </View>

                        <View style={styles.timelineCenter}>
                            <View style={[styles.timelineLine, isDark ? styles.bgBorderDark : styles.bgBorderLight]} />
                            <View style={[styles.durationBadge, isDark ? styles.gridItemDark : styles.gridItemLight, isDark ? styles.borderDark : styles.borderLight]}>
                                <Text style={[styles.durationText, isDark ? styles.textDark : styles.textLight]}>{durationStr}</Text>
                            </View>
                        </View>

                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Text style={[styles.timelineDate, isDark ? styles.textDark : styles.textLight]}>{exitDateRaw ? formatDateTime(exitDateRaw) : 'Active'}</Text>
                            <Text style={styles.timelineLabel}>Exit Date</Text>
                        </View>
                    </View>
                </View>

                {/* Classification & AI */}
                <View style={styles.splitRow}>
                    <View style={styles.flexHalf}>
                        <Text style={styles.sectionTitle}>Classification</Text>
                        <View style={[styles.classBox, isDark ? styles.gridItemDark : styles.gridItemLight, isDark ? styles.borderDark : styles.borderLight]}>
                            {strategyTags.length > 0 && (
                                <View style={styles.tagWrap}>
                                    {strategyTags.map((t, idx) => (
                                        <Text key={idx} style={styles.tagBadgeStyle}>{t}</Text>
                                    ))}
                                </View>
                            )}
                            <View style={[styles.classGridRow, isDark ? styles.borderDarkTop : styles.borderLightTop]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.gridLabel}>Session</Text>
                                    <Text style={[styles.classVal, isDark ? styles.textDark : styles.textLight]}>{trade.session || '—'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.gridLabel}>Emotional State</Text>
                                    <Text style={[styles.classVal, isDark ? styles.textDark : styles.textLight]}>{trade.emotional_state || '—'}</Text>
                                </View>
                            </View>
                            <View style={[styles.classGridRowStar, isDark ? styles.borderDarkTop : styles.borderLightTop]}>
                                <Text style={styles.gridLabel}>Trade Rating</Text>
                                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <MaterialIcons key={i} name="star" size={16} color={i <= (trade.trade_rating || 0) ? '#16a24e' : (isDark ? '#334155' : '#cbd5e1')} />
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={styles.flexHalf}>
                        <View style={styles.aiHeader}>
                            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>AI Analysis</Text>
                            <MaterialIcons name="auto-awesome" size={16} color="#16a24e" />
                        </View>
                        <View style={styles.aiBox}>
                            <Text style={[styles.aiText, isDark ? { color: '#cbd5e1' } : { color: '#475569' }]}>
                                "This trade alignment was strong technically. The sizing matches your historical win parameters.
                                Monitor closely moving forward as volatility may increase. (Generated by AI assistant placeholder)."
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Screenshots */}
                {images.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Screenshots</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                            {images.map((img, idx) => (
                                <View key={idx} style={[styles.imageCard, isDark ? styles.gridItemDark : styles.gridItemLight, isDark ? styles.borderDark : styles.borderLight]}>
                                    {img.url ? (
                                        <Image source={{ uri: img.url }} style={styles.imgEl} resizeMode="cover" />
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Broken Link</Text></View>
                                    )}
                                    <View style={styles.imgLabelWrap}>
                                        <Text style={styles.imgLabelText}>{img.file_name?.includes('exit') ? 'Exit confirmation' : 'Entry capture'}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Notes & Rationale */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes & Rationale</Text>
                    <View style={styles.notesBox}>
                        <Text style={[styles.notesText, isDark ? { color: '#94a3b8' } : { color: '#475569' }]}>
                            {trade.notes || 'No rationales provided.'}
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* Footer Actions */}
            <View style={[styles.footer, isDark ? styles.bgDark : styles.bgLight]}>
                <TouchableOpacity
                    style={[styles.actionBtn, isDark ? styles.borderDark : styles.borderLight]}
                    onPress={() => router.push({ pathname: '/trade/edit', params: { id: trade.id } } as any)}
                >
                    <MaterialIcons name="edit" size={20} color="#94a3b8" />
                    <Text style={[styles.actionBtnText, isDark ? styles.textDark : styles.textLight]}>Edit Trade</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, isDark ? styles.borderDark : styles.borderLight]}>
                    <MaterialIcons name="share" size={20} color="#94a3b8" />
                    <Text style={[styles.actionBtnText, isDark ? styles.textDark : styles.textLight]}>Share Entry</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    bgLight: { backgroundColor: '#f6f8f7' },
    bgDark: { backgroundColor: '#0a0f0c' },
    textLight: { color: '#0f172a' },
    textDark: { color: '#f8fafc' },
    borderLight: { borderColor: '#e2e8f0', borderWidth: 1 },
    borderDark: { borderColor: '#1e3126', borderWidth: 1 },
    borderLightTop: { borderTopColor: '#e2e8f0', borderTopWidth: 1 },
    borderDarkTop: { borderTopColor: '#1e3126', borderTopWidth: 1 },
    bgBorderLight: { backgroundColor: '#e2e8f0' },
    bgBorderDark: { backgroundColor: '#1e3126' },

    gridItemLight: { backgroundColor: '#ffffff' },
    gridItemDark: { backgroundColor: '#121d16' },

    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, marginBottom: 16 },
    errorBtn: { backgroundColor: '#16a24e', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    errorBtnText: { color: '#fff', fontWeight: 'bold' },

    navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderLeftWidth: 0, borderRightWidth: 0, borderTopWidth: 0 },
    navLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBtn: { padding: 4 },
    navTitleBox: { justifyContent: 'center' },
    navTitle: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
    navSubtitle: { fontSize: 10, color: '#64748b', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
    badgeWrapper: { backgroundColor: 'rgba(22, 162, 78, 0.2)', borderWidth: 1, borderColor: 'rgba(22, 162, 78, 0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
    badgeText: { fontSize: 10, color: '#16a24e', fontWeight: 'bold', letterSpacing: 1 },

    scrollContent: { paddingHorizontal: 24, paddingVertical: 32, paddingBottom: 120, gap: 40 },

    heroSection: { alignItems: 'center', gap: 16 },
    heroLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' },
    heroVal: { fontSize: 48, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

    closeActionBtn: { backgroundColor: '#16a24e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, marginTop: -16 },
    closeActionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },

    gridBox: { borderRadius: 12, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' },
    gridItem: { width: '50%', padding: 24, gap: 8 },
    gridBorderRight: { borderRightWidth: 1, borderRightColor: '#1e3126' },
    gridBorderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e3126' },
    gridLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' },
    gridVal: { fontSize: 20, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

    section: { gap: 16 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' },

    timelineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative' },
    timelineDate: { fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 4 },
    timelineLabel: { fontSize: 10, textTransform: 'uppercase', color: '#64748b' },
    timelineCenter: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
    timelineLine: { width: 100, height: 1, marginBottom: 8 },
    durationBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
    durationText: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' },

    splitRow: { flexDirection: 'row', gap: 24 },
    flexHalf: { flex: 1, gap: 16 },

    classBox: { borderRadius: 12, padding: 20 },
    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    tagBadgeStyle: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#16a24e', backgroundColor: 'rgba(22, 162, 78, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(22, 162, 78, 0.2)' },
    classGridRow: { flexDirection: 'row', paddingTop: 16 },
    classGridRowStar: { paddingTop: 16, marginTop: 16 },
    classVal: { fontSize: 14, fontWeight: '500', marginTop: 4 },

    aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    aiBox: { backgroundColor: 'rgba(22, 162, 78, 0.05)', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: 'rgba(22, 162, 78, 0.1)' },
    aiText: { fontSize: 14, fontStyle: 'italic', lineHeight: 24 },

    notesBox: { borderLeftWidth: 2, borderLeftColor: 'rgba(22, 162, 78, 0.3)', paddingLeft: 24 },
    notesText: { fontSize: 14, lineHeight: 24 },

    imageCard: { width: 320, height: 192, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    imgEl: { width: '100%', height: '100%' },
    imgLabelWrap: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    imgLabelText: { fontSize: 10, color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: 24, paddingTop: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 16 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
    actionBtnText: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }

})

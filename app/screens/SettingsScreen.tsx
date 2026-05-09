import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../utils/store';
import { Colors, Spacing, BorderRadius, Typography } from '../themes';
import { clearAllData } from '../storage';

// ===========================
// COMPOSANTS UI RÉUTILISABLES
// ===========================

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

interface RowProps {
  label: string;
  description?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

const Row = ({ label, description, right, onPress }: RowProps) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    <View style={styles.rowLeft}>
      <Text style={styles.rowLabel}>{label}</Text>
      {description && <Text style={styles.rowDesc}>{description}</Text>}
    </View>
    {right && <View style={styles.rowRight}>{right}</View>}
  </TouchableOpacity>
);

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

const StepSlider = ({ label, value, min, max, step, unit = '', onChange }: SliderRowProps) => (
  <View style={styles.sliderRow}>
    <View style={styles.sliderHeader}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.sliderValue}>{value}{unit}</Text>
    </View>
    <View style={styles.sliderControls}>
      <TouchableOpacity
        style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
        onPress={() => value > min && onChange(value - step)}
        disabled={value <= min}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>

      <View style={styles.sliderTrack}>
        <View
          style={[
            styles.sliderFill,
            { width: `${((value - min) / (max - min)) * 100}%` },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
        onPress={() => value < max && onChange(value + step)}
        disabled={value >= max}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ===========================
// SCREEN
// ===========================

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { settings, updateSettings } = useStore();
  const [clearing, setClearing] = useState(false);

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Effacer toutes les données',
      'Tous vos projets et fichiers seront définitivement supprimés. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout effacer',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            await clearAllData();
            await useStore.getState().loadProjects();
            setClearing(false);
            Alert.alert('✅', 'Toutes les données ont été supprimées.');
          },
        },
      ],
    );
  };

  const FONT_SIZE_OPTIONS = [10, 12, 13, 14, 15, 16, 18, 20];
  const TAB_SIZE_OPTIONS  = [2, 4];

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── ÉDITEUR ──────────────────────────────────── */}
        <SectionHeader title="🖊 Éditeur de code" />

        <View style={styles.card}>
          <StepSlider
            label="Taille de police"
            value={settings.fontSize}
            min={10}
            max={22}
            step={1}
            unit="px"
            onChange={v => updateSettings({ fontSize: v })}
          />

          <View style={styles.divider} />

          <View style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
              <Text style={styles.rowLabel}>Indentation (tabSize)</Text>
            </View>
            <View style={styles.optionRow}>
              {TAB_SIZE_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.optionBtn,
                    settings.tabSize === s && styles.optionBtnActive,
                  ]}
                  onPress={() => updateSettings({ tabSize: s })}
                >
                  <Text style={[
                    styles.optionBtnText,
                    settings.tabSize === s && styles.optionBtnTextActive,
                  ]}>
                    {s} espaces
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <Row
            label="Numéros de lignes"
            description="Afficher les numéros à gauche de l'éditeur"
            right={
              <Switch
                value={settings.showLineNumbers}
                onValueChange={v => updateSettings({ showLineNumbers: v })}
                trackColor={{ true: Colors.accent.primary, false: Colors.ui.border }}
                thumbColor={Colors.text.primary}
              />
            }
          />

          <View style={styles.divider} />

          <Row
            label="Retour à la ligne automatique"
            description="Couper les longues lignes"
            right={
              <Switch
                value={settings.wordWrap}
                onValueChange={v => updateSettings({ wordWrap: v })}
                trackColor={{ true: Colors.accent.primary, false: Colors.ui.border }}
                thumbColor={Colors.text.primary}
              />
            }
          />
        </View>

        {/* ── AUTO SAVE ─────────────────────────────────── */}
        <SectionHeader title="💾 Sauvegarde" />

        <View style={styles.card}>
          <Row
            label="Sauvegarde automatique"
            description="Sauvegarder le fichier après chaque modification"
            right={
              <Switch
                value={settings.autoSave}
                onValueChange={v => updateSettings({ autoSave: v })}
                trackColor={{ true: Colors.accent.primary, false: Colors.ui.border }}
                thumbColor={Colors.text.primary}
              />
            }
          />

          {settings.autoSave && (
            <>
              <View style={styles.divider} />
              <StepSlider
                label="Délai avant sauvegarde"
                value={settings.autoSaveDelay}
                min={500}
                max={5000}
                step={500}
                unit="ms"
                onChange={v => updateSettings({ autoSaveDelay: v })}
              />
            </>
          )}
        </View>

        {/* ── LIVE PREVIEW ──────────────────────────────── */}
        <SectionHeader title="👁 Live Preview" />

        <View style={styles.card}>
          <StepSlider
            label="Délai de mise à jour"
            value={settings.livePreviewDelay}
            min={200}
            max={3000}
            step={200}
            unit="ms"
            onChange={v => updateSettings({ livePreviewDelay: v })}
          />
          <View style={styles.divider} />
          <Text style={styles.hint}>
            💡 Un délai plus court = preview plus réactif mais plus gourmand en ressources.
          </Text>
        </View>

        {/* ── INTERFACE ─────────────────────────────────── */}
        <SectionHeader title="🎨 Interface" />

        <View style={styles.card}>
          <Row
            label="Retour haptique"
            description="Vibrations sur les actions importantes"
            right={
              <Switch
                value={settings.hapticFeedback}
                onValueChange={v => updateSettings({ hapticFeedback: v })}
                trackColor={{ true: Colors.accent.primary, false: Colors.ui.border }}
                thumbColor={Colors.text.primary}
              />
            }
          />
          <View style={styles.divider} />
          <View style={styles.themeRow}>
            <Text style={styles.rowLabel}>Thème</Text>
            <View style={styles.themeOptions}>
              {(['dark', 'darker', 'midnight'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeOption,
                    settings.theme === t && styles.themeOptionActive,
                  ]}
                  onPress={() => updateSettings({ theme: t })}
                >
                  <View style={[styles.themeSwatch, {
                    backgroundColor:
                      t === 'dark' ? '#0D1117' :
                      t === 'darker' ? '#080D13' :
                      '#000510',
                  }]} />
                  <Text style={[
                    styles.themeLabel,
                    settings.theme === t && { color: Colors.accent.primary },
                  ]}>
                    {t === 'dark' ? 'Dark' : t === 'darker' ? 'Darker' : 'Midnight'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── ABOUT ─────────────────────────────────────── */}
        <SectionHeader title="ℹ️ À propos" />

        <View style={styles.card}>
          <Row label="Version" right={
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>1.0.0 FREE</Text>
            </View>
          } />
          <View style={styles.divider} />
          <Row label="Développeur" right={<Text style={styles.metaText}>INCO BOY TECH</Text>} />
          <View style={styles.divider} />
          <Row label="Stockage" right={<Text style={styles.metaText}>Local (AsyncStorage)</Text>} />
          <View style={styles.divider} />
          <Row label="Framework" right={<Text style={styles.metaText}>React Native 0.73</Text>} />
        </View>

        {/* ── DANGER ZONE ───────────────────────────────── */}
        <SectionHeader title="⚠️ Zone de danger" />

        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={handleClearData}
            disabled={clearing}
          >
            <Text style={styles.dangerBtnText}>
              {clearing ? '⏳ Effacement...' : '🗑 Effacer toutes les données'}
            </Text>
            <Text style={styles.dangerBtnDesc}>
              Supprime tous les projets, fichiers et paramètres
            </Text>
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View style={styles.credits}>
          <Text style={styles.creditsText}>INCO CODE v1.0.0</Text>
          <Text style={styles.creditsSubText}>Fait avec ❤️ par INCO BOY TECH</Text>
          <Text style={styles.freeBadge}>FREE VERSION</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ===========================
// STYLES
// ===========================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.secondary,
    paddingTop: Platform.OS === 'android' ? 40 : 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.bg.tertiary,
  },
  backBtnText: { fontSize: 18, color: Colors.text.primary },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    padding: Spacing.base,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    overflow: 'hidden',
  },
  dangerCard: {
    borderColor: Colors.accent.danger + '40',
    backgroundColor: Colors.accent.danger + '05',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.ui.divider,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rowLeft: { flex: 1 },
  rowLabel: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  rowDesc: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  rowRight: {},
  metaText: {
    fontSize: 13,
    color: Colors.text.muted,
    fontFamily: 'Courier New',
  },
  hint: {
    fontSize: 12,
    color: Colors.text.muted,
    padding: 16,
    paddingTop: 8,
    lineHeight: 18,
  },

  // Slider
  sliderRow: {
    padding: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sliderValue: {
    fontSize: 14,
    color: Colors.accent.primary,
    fontFamily: 'Courier New',
    fontWeight: '700',
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.3 },
  stepBtnText: {
    fontSize: 18,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.bg.elevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
    borderRadius: 2,
  },

  // Options
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  optionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  optionBtnActive: {
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.primary + '15',
  },
  optionBtnText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontFamily: 'Courier New',
  },
  optionBtnTextActive: {
    color: Colors.accent.primary,
    fontWeight: '700',
  },

  // Theme
  themeRow: {
    padding: 16,
    gap: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.ui.border,
  },
  themeOptionActive: {
    borderColor: Colors.accent.primary,
  },
  themeSwatch: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  themeLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    fontWeight: '600',
  },

  // Version
  versionBadge: {
    backgroundColor: Colors.status.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.status.success + '40',
  },
  versionBadgeText: {
    fontSize: 11,
    color: Colors.status.success,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Danger
  dangerBtn: {
    padding: 16,
    alignItems: 'center',
  },
  dangerBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent.danger,
    marginBottom: 4,
  },
  dangerBtnDesc: {
    fontSize: 12,
    color: Colors.text.muted,
  },

  // Credits
  credits: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    gap: 6,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.muted,
    fontFamily: 'Courier New',
  },
  creditsSubText: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  freeBadge: {
    fontSize: 10,
    color: Colors.accent.secondary,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: Colors.accent.secondary + '40',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    marginTop: 4,
  },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing } from '../themes';
import { useStore } from '../utils/store';

const { width, height } = Dimensions.get('window');

// Simuler un LinearGradient avec des views superposées
const GradientBg = () => (
  <View style={StyleSheet.absoluteFillObject}>
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0A0E17' }]} />
    {/* Orbs décoratifs */}
    <View style={[styles.orb, styles.orbBlue]} />
    <View style={[styles.orb, styles.orbPurple]} />
    <View style={[styles.orb, styles.orbCyan]} />
    {/* Grille */}
    <View style={styles.grid}>
      {Array.from({ length: 12 }).map((_, i) => (
        <View key={i} style={styles.gridLine} />
      ))}
    </View>
  </View>
);

interface Props {
  onFinished: () => void;
}

export default function SplashScreen({ onFinished }: Props) {
  const initialize = useStore(s => s.initialize);

  // Animations
  const logoScale   = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTransY  = useRef(new Animated.Value(30)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const barWidth    = useRef(new Animated.Value(0)).current;
  const barOpacity  = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Lancer l'init en parallèle
    initialize();

    // Séquence d'animation
    Animated.sequence([
      // 1. Logo apparaît
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 2. Glow pulse
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3. Texte slide up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textTransY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 4. Tagline
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 5. Barre de chargement
      Animated.parallel([
        Animated.timing(barOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(barWidth, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      // Transition vers l'app principale
      setTimeout(onFinished, 200);
    });
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  const barInterpolated = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E17" />
      <GradientBg />

      {/* Logo central */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Glow derrière le logo */}
        <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />

        {/* Logo ASCII / icône */}
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>{'</>'}</Text>
        </View>
      </Animated.View>

      {/* Nom de l'app */}
      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTransY }],
          alignItems: 'center',
        }}
      >
        <Text style={styles.appName}>
          <Text style={styles.appNameAccent}>INCO</Text>
          {' '}
          <Text style={styles.appNameWhite}>CODE</Text>
        </Text>

        <Animated.View style={{ opacity: tagOpacity }}>
          <Text style={styles.tagline}>Mobile IDE · Codez n'importe où</Text>
        </Animated.View>
      </Animated.View>

      {/* Barre de chargement */}
      <Animated.View style={[styles.loadingContainer, { opacity: barOpacity }]}>
        <View style={styles.loadingTrack}>
          <Animated.View
            style={[
              styles.loadingBar,
              { width: barInterpolated },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>Chargement...</Text>
      </Animated.View>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionBadge}>FREE VERSION</Text>
        <Text style={styles.versionText}>v1.0.0 · INCO BOY TECH</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Background ─────────────────────────────────────
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbBlue: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(88, 166, 255, 0.08)',
    top: -80,
    right: -80,
  },
  orbPurple: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(188, 140, 255, 0.06)',
    bottom: 100,
    left: -60,
  },
  orbCyan: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(57, 208, 216, 0.05)',
    bottom: -40,
    right: 40,
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    opacity: 0.03,
  },
  gridLine: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#58A6FF',
  },

  // ── Logo ───────────────────────────────────────────
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#58A6FF',
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: '#161B22',
    borderWidth: 2,
    borderColor: '#58A6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#58A6FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  logoIcon: {
    fontSize: 40,
    color: '#58A6FF',
    fontFamily: 'Courier New',
    fontWeight: 'bold',
  },

  // ── Text ───────────────────────────────────────────
  appName: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  appNameAccent: {
    color: '#58A6FF',
  },
  appNameWhite: {
    color: '#E6EDF3',
  },
  tagline: {
    fontSize: 13,
    color: '#8B949E',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // ── Loading ────────────────────────────────────────
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    width: 200,
    alignItems: 'center',
  },
  loadingTrack: {
    width: '100%',
    height: 2,
    backgroundColor: '#21262D',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#58A6FF',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 11,
    color: '#6E7681',
    letterSpacing: 1,
  },

  // ── Version ────────────────────────────────────────
  versionContainer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    gap: 4,
  },
  versionBadge: {
    fontSize: 10,
    color: '#3FB950',
    letterSpacing: 2,
    backgroundColor: 'rgba(63, 185, 80, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(63, 185, 80, 0.3)',
    textTransform: 'uppercase',
  },
  versionText: {
    fontSize: 10,
    color: '#6E7681',
    letterSpacing: 1,
  },
});

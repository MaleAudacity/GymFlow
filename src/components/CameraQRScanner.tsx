import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Flashlight, FlashlightOff, RefreshCw, AlertCircle, Camera as CameraIcon } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { NeoCard } from './NeoCard';
import { NeoButton } from './NeoButton';
import { neoShadow, FONT_FAMILY, FONT_BOLD, FONT_BLACK, FONT_EXTRABOLD, FONT_SEMIBOLD } from '../theme';

interface CameraQRScannerProps {
  onScan: (data: string) => void;
  isScanning: boolean;
}

const { width } = Dimensions.get('window');
const SCAN_FRAME_SIZE = Math.min(width * 0.72, 280);

export const CameraQRScanner: React.FC<CameraQRScannerProps> = ({ onScan, isScanning }) => {
  const { theme } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState(false);
  const lastScannedTimeRef = useRef<number>(0);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    const now = Date.now();
    if (now - lastScannedTimeRef.current < 2000) return;
    lastScannedTimeRef.current = now;
    if (result?.data) {
      onScan(result.data);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.surfaceSubtle }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.statusText, { color: theme.textMuted, fontFamily: FONT_SEMIBOLD }]}>
          Requesting camera access...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <NeoCard style={styles.permissionCard} shadowOffset={4}>
        <CameraIcon size={48} color={theme.primary} strokeWidth={2} />
        <Text style={[styles.permTitle, { color: theme.text, fontFamily: FONT_BLACK }]}>
          Camera Permission Needed
        </Text>
        <Text style={[styles.permDesc, { color: theme.textMuted, fontFamily: FONT_FAMILY }]}>
          GymFlow requires camera access to quickly scan member QR codes at your front desk reception.
        </Text>
        <NeoButton
          title="Grant Camera Access"
          variant="primary"
          size="md"
          onPress={requestPermission}
          style={{ marginTop: 16 }}
        />
      </NeoCard>
    );
  }

  return (
    <View style={[styles.cameraContainer, { borderColor: theme.border }]}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />

      {/* Modern Neubrutalist Scanner Overlay */}
      <View style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.headerControls}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setTorch(!torch)}
            style={[
              styles.controlBtn,
              { backgroundColor: torch ? theme.yellow : 'rgba(0,0,0,0.6)' },
            ]}
          >
            {torch ? (
              <Flashlight size={20} color="#18181B" strokeWidth={2.5} />
            ) : (
              <FlashlightOff size={20} color="#FFFFFF" strokeWidth={2.5} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            style={[styles.controlBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
          >
            <RefreshCw size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Center Scanner Frame */}
        <View style={styles.frameContainer}>
          <View
            style={[
              styles.scanFrame,
              {
                width: 220,
                height: 220,
                borderColor: theme.yellow,
              },
            ]}
          >
            {/* Corner Markers */}
            <View style={[styles.corner, styles.cornerTL, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: theme.primary }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: theme.primary }]} />
          </View>
          <Text style={[styles.instruction, { fontFamily: FONT_BOLD }]}>Align Member QR in Box</Text>
        </View>

        {/* Bottom space */}
        <View style={{ height: 20 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    width: '100%',
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
  },
  centerContainer: {
    height: 280,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionCard: {
    borderWidth: 2,
    borderRadius: 20,
    margin: 16,
    padding: 24,
  },
  permTitle: {
    fontSize: 18,
    marginTop: 12,
    textAlign: 'center',
  },
  permDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  statusText: {
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  frameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  scanFrame: {
    borderWidth: 1,
    borderRadius: 20,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 4,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  instruction: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 14,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

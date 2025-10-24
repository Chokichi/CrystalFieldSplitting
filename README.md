# Crystal Field Theory Visualizer

An interactive 3D visualization tool for understanding crystal field splitting in transition metal complexes. This React + Three.js application demonstrates how ligand geometry and field strength affect d-orbital energy levels.

## Features

### 🎯 **Interactive 3D Visualization**
- **Metal Complex Scene**: 3D representation of octahedral and square planar complexes
- **Real-time Updates**: Ligand positions and orbital splitting update dynamically
- **Orbital Visualization**: Toggle d-orbital lobes to see their spatial arrangement
- **Smooth Animations**: Framer Motion powered transitions

### ⚛️ **Crystal Field Theory**
- **Octahedral Complexes**: Shows t₂g (dxy, dxz, dyz) and eg (dz², dx²-y²) splitting
- **Square Planar Complexes**: Demonstrates the unique dx²-y² destabilization
- **Ligand Field Strength**: Compare weak field (I⁻, Br⁻) to strong field (CN⁻) ligands
- **Distance Effects**: Visualize how proximity affects orbital splitting

### 🎮 **Interactive Controls**
- **Geometry Selector**: Switch between octahedral and square planar
- **Distance Slider**: Adjust ligand-metal distance (1.0 - 4.0 Å)
- **Ligand Selection**: Choose from 6 different ligands with varying field strengths
- **Orbital Toggle**: Show/hide d-orbital lobe visualization

## Educational Value

This tool helps students understand:

1. **Spatial Relationships**: How d-orbitals interact with ligands in different geometries
2. **Energy Splitting**: Why certain orbitals are destabilized more than others
3. **Ligand Effects**: How ligand identity affects crystal field splitting
4. **Distance Dependence**: The inverse relationship between distance and splitting

## Technical Implementation

### **Frontend Stack**
- **React 18** with hooks for state management
- **Three.js** via `@react-three/fiber` for 3D rendering
- **Material-UI** for consistent, accessible UI components
- **Framer Motion** for smooth animations
- **Vite** for fast development and building

### **Key Components**

#### `MetalComplexScene.jsx`
- Renders 3D metal-ligand complex
- Generates d-orbital lobe geometries
- Handles octahedral vs square planar positioning
- Animated orbital visualization

#### `OrbitalSplittingDiagram.jsx`
- Real-time energy level diagram
- Physics-based splitting calculations
- Color-coded orbital energy levels
- Dynamic splitting value display

#### `ControlsPanel.jsx`
- Interactive controls for all parameters
- Ligand selection with visual indicators
- Educational tooltips and tips
- Responsive design

### **Physics Model**

The energy calculations use a simplified crystal field model:

```javascript
// Base energy calculation
const base = ligandStrength / Math.pow(distance, 3);

// Octahedral splitting
const octahedral = {
  eg: base * 0.6,      // dz², dx²-y² (higher energy)
  t2g: -base * 0.4,    // dxy, dxz, dyz (lower energy)
  splitting: base * 1.0
};

// Square planar splitting
const squarePlanar = {
  dx2y2: base * 1.8,   // highest energy
  dz2: base * 1.0,     // moderate energy
  dxy: -base * 0.3,    // lower energy
  dxz: -base * 0.3,    // lower energy
  dyz: -base * 0.3,    // lower energy
  splitting: base * 2.1
};
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd crystal-field-visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
npm run preview
```

## Usage

1. **Select Geometry**: Choose between octahedral and square planar
2. **Adjust Distance**: Use the slider to move ligands closer/farther
3. **Change Ligands**: Select different ligands to see field strength effects
4. **Toggle Orbitals**: Show/hide d-orbital lobes for spatial understanding
5. **Observe Changes**: Watch the energy diagram update in real-time

## Educational Applications

### **Chemistry Courses**
- Inorganic Chemistry: Crystal field theory
- Coordination Chemistry: Ligand field effects
- Physical Chemistry: Electronic structure

### **Learning Objectives**
- Understand d-orbital splitting in different geometries
- Visualize ligand field strength effects
- Connect molecular geometry to electronic structure
- Explore distance-dependent interactions

## Future Enhancements

- [ ] Tetrahedral geometry support
- [ ] Jahn-Teller distortion visualization
- [ ] High-spin vs low-spin electron configurations
- [ ] UV-Vis absorption spectrum simulation
- [ ] Multiple metal centers
- [ ] Export functionality for presentations

## Contributing

This project is designed for educational use. Contributions that improve the educational value, accessibility, or visual clarity are welcome.

## License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for chemistry education**

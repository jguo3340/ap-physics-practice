// The 8 units of AP Physics 1, following the College Board Course and Exam
// Description. Every page that lists units reads from this file, so a change
// here shows up across the whole site.

export interface Topic {
  /** Topic number from the course description, e.g. "2.5" */
  id: string;
  title: string;
}

export interface Equation {
  /** KaTeX source, e.g. "v_x = v_{x0} + a_x t" */
  tex: string;
  /** What the equation is for, in a few words */
  label: string;
}

export interface Unit {
  number: number;
  /** Used in the page address, e.g. /units/kinematics */
  slug: string;
  title: string;
  /** One-sentence description in our own words */
  summary: string;
  /** Share of the multiple-choice section, in percent: [low, high] */
  examWeight: [number, number];
  topics: Topic[];
  /** Shown in the equation sheet on the practice page */
  equations?: Equation[];
}

export const units: Unit[] = [
  {
    number: 1,
    slug: 'kinematics',
    title: 'Kinematics',
    summary:
      'Describing motion with position, velocity, and acceleration, in one and two dimensions, using graphs and equations.',
    examWeight: [10, 15],
    topics: [
      { id: '1.1', title: 'Scalars and Vectors in One Dimension' },
      { id: '1.2', title: 'Displacement, Velocity, and Acceleration' },
      { id: '1.3', title: 'Representing Motion' },
      { id: '1.4', title: 'Reference Frames and Relative Motion' },
      { id: '1.5', title: 'Vectors and Motion in Two Dimensions' },
    ],
    equations: [
      { label: 'Average velocity', tex: '\\bar v_x = \\dfrac{\\Delta x}{\\Delta t}' },
      { label: 'Average acceleration', tex: '\\bar a_x = \\dfrac{\\Delta v_x}{\\Delta t}' },
      { label: 'Velocity, constant acceleration', tex: 'v_x = v_{x0} + a_x t' },
      { label: 'Position, constant acceleration', tex: 'x = x_0 + v_{x0} t + \\tfrac12 a_x t^2' },
      { label: 'Velocity and position', tex: 'v_x^2 = v_{x0}^2 + 2 a_x (x - x_0)' },
      { label: 'Free fall near Earth', tex: 'g = 9.8\\ \\text{m/s}^2' },
    ],
  },
  {
    number: 2,
    slug: 'force-and-translational-dynamics',
    title: 'Force and Translational Dynamics',
    summary:
      "How forces change motion: free-body diagrams, Newton's laws, gravity, friction, springs, and circular motion.",
    examWeight: [18, 23],
    topics: [
      { id: '2.1', title: 'Systems and Center of Mass' },
      { id: '2.2', title: 'Forces and Free-Body Diagrams' },
      { id: '2.3', title: "Newton's Third Law" },
      { id: '2.4', title: "Newton's First Law" },
      { id: '2.5', title: "Newton's Second Law" },
      { id: '2.6', title: 'Gravitational Force' },
      { id: '2.7', title: 'Kinetic and Static Friction' },
      { id: '2.8', title: 'Spring Forces' },
      { id: '2.9', title: 'Circular Motion' },
    ],
    equations: [
      { label: "Newton's second law", tex: '\\vec a = \\dfrac{\\sum \\vec F}{m}' },
      { label: 'Center of mass', tex: 'x_{cm} = \\dfrac{\\sum m_i x_i}{\\sum m_i}' },
      { label: 'Gravitational force', tex: 'F_g = G\\dfrac{m_1 m_2}{r^2}' },
      { label: 'Gravitational field', tex: 'g = \\dfrac{F_g}{m} = G\\dfrac{M}{r^2}' },
      { label: 'Friction', tex: 'F_f \\le \\mu F_n' },
      { label: 'Spring force', tex: 'F_s = k\\,\\lvert \\Delta x \\rvert' },
      { label: 'Centripetal acceleration', tex: 'a_c = \\dfrac{v^2}{r}' },
      { label: 'Constants', tex: 'g = 9.8\\ \\text{m/s}^2, \\quad G = 6.67 \\times 10^{-11}\\ \\text{N}\\cdot\\text{m}^2/\\text{kg}^2' },
    ],
  },
  {
    number: 3,
    slug: 'work-energy-and-power',
    title: 'Work, Energy, and Power',
    summary:
      'Kinetic and potential energy, the work done by forces, conservation of energy, and power.',
    examWeight: [18, 23],
    topics: [
      { id: '3.1', title: 'Translational Kinetic Energy' },
      { id: '3.2', title: 'Work' },
      { id: '3.3', title: 'Potential Energy' },
      { id: '3.4', title: 'Conservation of Energy' },
      { id: '3.5', title: 'Power' },
    ],
    equations: [
      { label: 'Kinetic energy', tex: 'K = \\tfrac12 m v^2' },
      { label: 'Work', tex: 'W = F_\\parallel d = F d \\cos\\theta' },
      { label: 'Work–energy theorem', tex: 'W_{net} = \\Delta K' },
      { label: 'Gravitational potential energy (near Earth)', tex: '\\Delta U_g = m g \\Delta y' },
      { label: 'Gravitational potential energy (any distance)', tex: 'U_G = -\\dfrac{G m_1 m_2}{r}' },
      { label: 'Spring potential energy', tex: 'U_s = \\tfrac12 k x^2' },
      { label: 'Power', tex: 'P = \\dfrac{\\Delta E}{\\Delta t} = F_\\parallel v' },
    ],
  },
  {
    number: 4,
    slug: 'linear-momentum',
    title: 'Linear Momentum',
    summary:
      'Momentum, impulse, and what is conserved when objects collide, in both elastic and inelastic collisions.',
    examWeight: [10, 15],
    topics: [
      { id: '4.1', title: 'Linear Momentum' },
      { id: '4.2', title: 'Change in Momentum and Impulse' },
      { id: '4.3', title: 'Conservation of Linear Momentum' },
      { id: '4.4', title: 'Elastic and Inelastic Collisions' },
    ],
    equations: [
      { label: 'Momentum', tex: '\\vec p = m \\vec v' },
      { label: 'Impulse', tex: '\\Delta \\vec p = \\vec F \\Delta t' },
      { label: 'Velocity of the center of mass', tex: '\\vec v_{cm} = \\dfrac{\\sum m_i \\vec v_i}{\\sum m_i}' },
      { label: 'Conservation (no net external force)', tex: '\\sum \\vec p_{\\text{before}} = \\sum \\vec p_{\\text{after}}' },
      { label: 'Kinetic energy', tex: 'K = \\tfrac12 m v^2' },
    ],
  },
  {
    number: 5,
    slug: 'torque-and-rotational-dynamics',
    title: 'Torque and Rotational Dynamics',
    summary:
      "Rotational motion, torque, rotational inertia, and Newton's laws written for things that spin.",
    examWeight: [10, 15],
    topics: [
      { id: '5.1', title: 'Rotational Kinematics' },
      { id: '5.2', title: 'Connecting Linear and Rotational Motion' },
      { id: '5.3', title: 'Torque' },
      { id: '5.4', title: 'Rotational Inertia' },
      { id: '5.5', title: "Rotational Equilibrium and Newton's First Law in Rotational Form" },
      { id: '5.6', title: "Newton's Second Law in Rotational Form" },
    ],
    equations: [
      { label: 'Angular velocity, constant α', tex: '\\omega = \\omega_0 + \\alpha t' },
      { label: 'Angle, constant α', tex: '\\theta = \\theta_0 + \\omega_0 t + \\tfrac12 \\alpha t^2' },
      { label: 'Angular velocity and angle', tex: '\\omega^2 = \\omega_0^2 + 2\\alpha(\\theta - \\theta_0)' },
      { label: 'Linear and rotational', tex: 'v = r\\omega, \\quad a_T = r\\alpha' },
      { label: 'Torque', tex: '\\tau = r_\\perp F = r F \\sin\\theta' },
      { label: "Newton's second law, rotation", tex: '\\alpha = \\dfrac{\\sum \\tau}{I}' },
      { label: 'Rotational inertia', tex: 'I = \\sum m_i r_i^2, \\quad I_{\\text{axis}} = I_{cm} + M d^2' },
    ],
  },
  {
    number: 6,
    slug: 'energy-and-momentum-of-rotating-systems',
    title: 'Energy and Momentum of Rotating Systems',
    summary:
      'Rotational kinetic energy, angular momentum and its conservation, rolling, and orbiting satellites.',
    examWeight: [5, 8],
    topics: [
      { id: '6.1', title: 'Rotational Kinetic Energy' },
      { id: '6.2', title: 'Torque and Work' },
      { id: '6.3', title: 'Angular Momentum and Angular Impulse' },
      { id: '6.4', title: 'Conservation of Angular Momentum' },
      { id: '6.5', title: 'Rolling' },
      { id: '6.6', title: 'Motion of Orbiting Satellites' },
    ],
    equations: [
      { label: 'Rotational kinetic energy', tex: 'K = \\tfrac12 I \\omega^2' },
      { label: 'Work done by a torque', tex: 'W = \\tau \\Delta\\theta' },
      { label: 'Angular momentum', tex: 'L = I\\omega, \\quad L = r m v \\sin\\theta' },
      { label: 'Angular impulse', tex: '\\Delta L = \\tau \\Delta t' },
      { label: 'Rolling without slipping', tex: 'v_{cm} = r\\omega' },
      { label: 'Gravitational force', tex: 'F_g = G\\dfrac{m_1 m_2}{r^2}' },
      { label: 'Gravitational potential energy', tex: 'U_G = -\\dfrac{G m_1 m_2}{r}' },
    ],
  },
  {
    number: 7,
    slug: 'oscillations',
    title: 'Oscillations',
    summary:
      'Simple harmonic motion of springs and pendulums: period, frequency, graphs of the motion, and energy.',
    examWeight: [5, 8],
    topics: [
      { id: '7.1', title: 'Defining Simple Harmonic Motion (SHM)' },
      { id: '7.2', title: 'Frequency and Period of SHM' },
      { id: '7.3', title: 'Representing and Analyzing SHM' },
      { id: '7.4', title: 'Energy of Simple Harmonic Oscillators' },
    ],
    equations: [
      { label: 'Period and frequency', tex: 'T = \\dfrac{1}{f} = \\dfrac{2\\pi}{\\omega}' },
      { label: 'Block on a spring', tex: 'T_s = 2\\pi\\sqrt{\\dfrac{m}{k}}' },
      { label: 'Pendulum (small angles)', tex: 'T_p = 2\\pi\\sqrt{\\dfrac{\\ell}{g}}' },
      { label: 'Position in SHM', tex: 'x = A\\cos(2\\pi f t)' },
      { label: 'Spring force', tex: 'F_s = -k x' },
      { label: 'Spring potential energy', tex: 'U_s = \\tfrac12 k x^2' },
      { label: 'Total energy of a spring oscillator', tex: 'E = \\tfrac12 k A^2' },
    ],
  },
  {
    number: 8,
    slug: 'fluids',
    title: 'Fluids',
    summary:
      "Density, pressure, buoyancy, and how Newton's laws and conservation laws apply to liquids and gases.",
    examWeight: [10, 15],
    topics: [
      { id: '8.1', title: 'Internal Structure and Density' },
      { id: '8.2', title: 'Pressure' },
      { id: '8.3', title: "Fluids and Newton's Laws" },
      { id: '8.4', title: 'Fluids and Conservation Laws' },
    ],
  },
];

/** Format of the AP Physics 1 exam, from the course description. */
export const examFormat = [
  { section: 'Section I', kind: 'Multiple choice', questions: 42, minutes: 85, weight: 50 },
  { section: 'Section II', kind: 'Free response', questions: 4, minutes: 95, weight: 50 },
];

'use client';

import { motion } from 'framer-motion';
import TagDisplay from './TagDisplay';

export default function AnimatedTagDisplay({ autoTags, humanTags }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
    >
      <TagDisplay autoTags={autoTags} humanTags={humanTags} />
    </motion.div>
  );
}

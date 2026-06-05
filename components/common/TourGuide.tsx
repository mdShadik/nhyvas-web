import { Joyride, Step, STATUS } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface TourGuideProps {
  steps: Step[];
  tourKey: string;
}

export const TourGuide = ({ steps, tourKey }: TourGuideProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [run, setRun] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      const hasSeenTour = localStorage.getItem(tourKey);
      if (!hasSeenTour) {
        setRun(true);
      }
    }
  }, [tourKey]);

  const handleJoyrideEvent = (data: any) => {
    const { status } = data;
    
    // Set the seen flag as soon as the tour starts, finishes, or is skipped.
    // This ensures it strictly appears only once per browser.
    if ([STATUS.RUNNING, STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem(tourKey, 'true');
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
    }
  };

  return (
    <Joyride
      onEvent={handleJoyrideEvent}
      continuous
      run={run}
      scrollToFirstStep
      steps={steps}
      options={{
        primaryColor: '#6366f1', // primary-500 from globals.css
        zIndex: 1000,
        showProgress: true,
        buttons: ['back', 'skip', 'primary'],
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        arrowColor: isDark ? '#1e293b' : '#ffffff',
        textColor: isDark ? '#f8fafc' : '#0f172a',
        overlayColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
      }}
      styles={{
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonPrimary: {
          borderRadius: '12px',
          fontWeight: 'bold',
          padding: '10px 20px',
        },
        buttonBack: {
          fontWeight: 'bold',
          marginRight: '10px',
          color: isDark ? '#cbd5e1' : '#475569',
        },
        buttonSkip: {
          color: isDark ? '#94a3b8' : '#64748b',
        }
      }}
      locale={{
        back: t('tour.back'),
        close: t('tour.close'),
        last: t('tour.finish'),
        next: t('tour.next'),
        skip: t('tour.skip'),
      }}
    />
  );
};

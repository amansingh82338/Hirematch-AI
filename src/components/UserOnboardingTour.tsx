import React from 'react';
import { Joyride, EventData, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ONBOARDING_TOUR_STEPS, markTourCompleted } from '../services/tour';
import { X, ArrowRight, ArrowLeft, Check, Compass } from 'lucide-react';

interface UserOnboardingTourProps {
  run: boolean;
  onFinish?: () => void;
  stepIndex?: number;
}

const CustomTourTooltip: React.FC<TooltipRenderProps> = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}) => {
  return (
    <div
      {...tooltipProps}
      style={{ zIndex: 10002 }}
      className="relative z-[10002] w-84 sm:w-96 rounded-xl border border-crm-border bg-crm-surface text-crm-text p-5 shadow-2xl text-left font-sans animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header bar: Step indicator & close button */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-crm-border mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-crm-surface-secondary border border-crm-border text-crm-accent">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-crm-text-secondary">
            Step {index + 1} of {size}
          </span>
        </div>
        <button
          {...closeProps}
          type="button"
          aria-label="Close tour"
          className="p-1 rounded-md text-crm-text-secondary hover:text-crm-text hover:bg-crm-surface-muted transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-crm-text tracking-tight mb-2">
        {step.title}
      </h3>

      {/* Content description */}
      <div className="text-xs text-crm-text-secondary leading-relaxed mb-5">
        {step.content}
      </div>

      {/* Step progress dots */}
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: size }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === index
                ? 'w-5 bg-crm-accent'
                : i < index
                ? 'w-1.5 bg-crm-accent/40'
                : 'w-1.5 bg-crm-border'
            }`}
          />
        ))}
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-3 border-t border-crm-border">
        {skipProps && !isLastStep ? (
          <button
            {...skipProps}
            type="button"
            className="text-xs text-crm-text-secondary hover:text-crm-text transition-colors cursor-pointer font-medium"
          >
            Skip Tour
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              type="button"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-crm-border bg-crm-surface-muted text-crm-text hover:bg-crm-surface-secondary transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            {...primaryProps}
            type="button"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-crm-accent text-crm-accent-fg hover:bg-crm-accent-hover shadow-xs transition-colors cursor-pointer"
          >
            {isLastStep ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const UserOnboardingTour: React.FC<UserOnboardingTourProps> = ({
  run,
  onFinish,
  stepIndex,
}) => {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      if (user?.id) {
        markTourCompleted(user.id);
      }
      if (onFinish) {
        onFinish();
      }
    }
  };

  const steps: Step[] = ONBOARDING_TOUR_STEPS.map((s) => ({
    target: s.target,
    title: s.title,
    content: s.content,
    placement: s.placement || 'auto',
    skipBeacon: true,
  }));

  if (!run) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous={true}
      options={{
        skipBeacon: true,
        zIndex: 10000,
      }}
      tooltipComponent={CustomTourTooltip}
      onEvent={handleJoyrideCallback}
      styles={{
        overlay: {
          backgroundColor:
            effectiveTheme === 'dark'
              ? 'rgba(8, 19, 16, 0.75)'
              : 'rgba(36, 35, 31, 0.45)',
        },
        spotlight: {
          rx: 12,
        },
      }}
    />
  );
};


import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbsProps {
  currentStep: number;
  stepLabels: string[];
  onStepClick?: (step: number) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  currentStep, 
  stepLabels, 
  onStepClick 
}) => {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCurrentStep = stepNumber === currentStep;
          const isCompletedStep = stepNumber < currentStep;
          const isClickable = onStepClick && isCompletedStep;

          return (
            <React.Fragment key={stepNumber}>
              <BreadcrumbItem>
                {isCurrentStep ? (
                  <BreadcrumbPage className="font-semibold text-jumper-blue">
                    {stepNumber}. {label}
                  </BreadcrumbPage>
                ) : isClickable ? (
                  <BreadcrumbLink 
                    className="cursor-pointer hover:text-jumper-blue text-gray-600"
                    onClick={() => onStepClick(stepNumber)}
                  >
                    {stepNumber}. {label}
                  </BreadcrumbLink>
                ) : (
                  <span className={`${
                    isCompletedStep ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {stepNumber}. {label}
                  </span>
                )}
              </BreadcrumbItem>
              {index < stepLabels.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;

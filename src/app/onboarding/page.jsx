"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Brain, TrendingUp, Shield, Zap } from "lucide-react";

const steps = [
  {
    id: "welcome",
    title: "Welcome to Bluepips",
    subtitle: "Your AI-powered forex trading companion",
    icon: Brain,
    content: (
      <div className="text-center space-y-4">
        <p className="text-gray-300 text-lg">
          Experience the future of forex trading with our advanced AI algorithms 
          that analyze market patterns and generate high-confidence trading signals.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-[#1a2332] p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">87%</div>
            <div className="text-sm text-gray-400">Success Rate</div>
          </div>
          <div className="bg-[#1a2332] p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">50+</div>
            <div className="text-sm text-gray-400">Currency Pairs</div>
          </div>
          <div className="bg-[#1a2332] p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">24/7</div>
            <div className="text-sm text-gray-400">Market Monitoring</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "features",
    title: "Powerful Features",
    subtitle: "Everything you need for successful trading",
    icon: Zap,
    content: (
      <div className="space-y-4">
        {[
          { title: "AI Signal Generation", desc: "Machine learning algorithms analyze market patterns" },
          { title: "Real-time Alerts", desc: "Instant notifications for trading opportunities" },
          { title: "Risk Management", desc: "Built-in stop-loss and position sizing" },
          { title: "Performance Analytics", desc: "Detailed insights into your trading performance" },
        ].map((feature, idx) => (
          <div key={idx} className="bg-[#1a2332] p-4 rounded-lg border border-gray-700">
            <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
            <p className="text-gray-400 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "safety",
    title: "Trade with Confidence",
    subtitle: "Your security is our priority",
    icon: Shield,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-6">
          <h3 className="text-green-400 font-semibold mb-3">Safety Features:</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Kill switch for emergency trade closure
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Maximum daily trade limits
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Position size controls
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Real-time risk monitoring
            </li>
          </ul>
        </div>
        <p className="text-gray-400 text-sm">
          Start with demo mode to practice without risking real money.
        </p>
      </div>
    ),
  },
  {
    id: "ready",
    title: "Ready to Start?",
    subtitle: "Join thousands of successful traders",
    icon: TrendingUp,
    content: (
      <div className="text-center space-y-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-2">What's Next?</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <span className="text-gray-300">Explore the dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <span className="text-gray-300">Review AI trading signals</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <span className="text-gray-300">Start with demo trading</span>
            </div>
          </div>
        </div>
        <p className="text-gray-400">
          You're all set! Let's begin your trading journey.
        </p>
      </div>
    ),
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      router.push("/dashboard");
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 mx-1 rounded-full transition-all ${
                  idx <= currentStep ? "bg-blue-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
          <div className="text-center text-sm text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Content card */}
        <div className="bg-[#151F2E] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-full">
              <CurrentIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white text-center mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-400 text-center mb-8">
            {steps[currentStep].subtitle}
          </p>

          {/* Step content */}
          <div className="mb-8">{steps[currentStep].content}</div>

          {/* Navigation buttons */}
          <div className="flex gap-4">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

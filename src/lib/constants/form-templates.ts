/**
 * Form Templates
 * Pre-built form templates to help users get started quickly
 */

import type { QuestionType, QuestionOptions } from '@/lib/types/question.types';



export interface FormTemplate {

  id: string;

  name: string;

  description: string;

  category: 'feedback' | 'survey' | 'registration' | 'quiz' | 'assessment' | 'other';

  icon: string;

  questions: Array<{

    type: QuestionType;

    title: string;

    description?: string;

    required: boolean;

    options?: QuestionOptions;

  }>;

}

export const FORM_TEMPLATES: FormTemplate[] = [
  // Feedback Templates
  {
    id: 'customer-satisfaction',
    name: 'Customer Satisfaction Survey',
    description: 'Measure customer satisfaction with your product or service',
    category: 'feedback',
    icon: '😊',
    questions: [
      {
        type: 'linear_scale',
        title: 'How satisfied are you with our product/service?',
        description: 'Rate your overall satisfaction',
        required: true,
        options: {
          min: 1,
          max: 5,
          minLabel: 'Very Dissatisfied',
          maxLabel: 'Very Satisfied',
          step: 1,
        },
      },
      {
        type: 'multiple_choice',
        title: 'How likely are you to recommend us to a friend or colleague?',
        description: 'Net Promoter Score (NPS)',
        required: true,
        options: {
          choices: [
            { id: '1', label: 'Not at all likely' },
            { id: '2', label: 'Unlikely' },
            { id: '3', label: 'Neutral' },
            { id: '4', label: 'Likely' },
            { id: '5', label: 'Very likely' },
          ],
        },
      },
      {
        type: 'checkboxes',
        title: 'What features do you use most often?',
        required: false,
        options: {
          choices: [
            { id: '1', label: 'Dashboard' },
            { id: '2', label: 'Reports' },
            { id: '3', label: 'Analytics' },
            { id: '4', label: 'Integrations' },
            { id: '5', label: 'Support' },
          ],
          allowOther: true,
        },
      },
      {
        type: 'long_text',
        title: 'What improvements would you like to see?',
        description: 'Please share your suggestions',
        required: false,
        options: {
          placeholder: 'Your feedback helps us improve...',
          rows: 4,
        },
      },
    ],
  },

  {
    id: 'event-feedback',
    name: 'Event Feedback Form',
    description: 'Gather feedback from event attendees',
    category: 'feedback',
    icon: '🎉',
    questions: [
      {
        type: 'linear_scale',
        title: 'How would you rate this event overall?',
        required: true,
        options: {
          min: 1,
          max: 10,
          minLabel: 'Poor',
          maxLabel: 'Excellent',
          step: 1,
        },
      },
      {
        type: 'checkboxes',
        title: 'Which sessions did you attend?',
        required: true,
        options: {
          choices: [
            { id: '1', label: 'Opening Keynote' },
            { id: '2', label: 'Workshop A' },
            { id: '3', label: 'Workshop B' },
            { id: '4', label: 'Panel Discussion' },
            { id: '5', label: 'Networking Session' },
          ],
        },
      },
      {
        type: 'matrix',
        title: 'Rate each aspect of the event',
        required: true,
        options: {
          type: 'radio',
          rows: [
            { id: '1', label: 'Content Quality' },
            { id: '2', label: 'Speakers' },
            { id: '3', label: 'Venue' },
            { id: '4', label: 'Organization' },
          ],
          columns: [
            { id: '1', label: 'Poor' },
            { id: '2', label: 'Fair' },
            { id: '3', label: 'Good' },
            { id: '4', label: 'Excellent' },
          ],
        },
      },
      {
        type: 'long_text',
        title: 'What could we improve for next time?',
        required: false,
        options: {
          placeholder: 'Share your thoughts...',
          rows: 3,
        },
      },
    ],
  },

  // Survey Templates
  {
    id: 'market-research',
    name: 'Market Research Survey',
    description: 'Conduct market research and gather insights',
    category: 'survey',
    icon: '📊',
    questions: [
      {
        type: 'multiple_choice',
        title: 'What is your age range?',
        required: true,
        options: {
          choices: [
            { id: '1', label: '18-24' },
            { id: '2', label: '25-34' },
            { id: '3', label: '35-44' },
            { id: '4', label: '45-54' },
            { id: '5', label: '55+' },
          ],
        },
      },
      {
        type: 'multiple_choice',
        title: 'How often do you use our type of product?',
        required: true,
        options: {
          choices: [
            { id: '1', label: 'Daily' },
            { id: '2', label: 'Weekly' },
            { id: '3', label: 'Monthly' },
            { id: '4', label: 'Rarely' },
            { id: '5', label: 'Never' },
          ],
        },
      },
      {
        type: 'checkboxes',
        title: 'What factors influence your purchase decision?',
        required: true,
        options: {
          choices: [
            { id: '1', label: 'Price' },
            { id: '2', label: 'Quality' },
            { id: '3', label: 'Brand' },
            { id: '4', label: 'Features' },
            { id: '5', label: 'Reviews' },
          ],
          allowOther: true,
        },
      },
      {
        type: 'linear_scale',
        title: 'How likely are you to purchase this product?',
        required: true,
        options: {
          min: 1,
          max: 10,
          minLabel: 'Not at all likely',
          maxLabel: 'Extremely likely',
          step: 1,
        },
      },
    ],
  },

  // Registration Templates
  {
    id: 'event-registration',
    name: 'Event Registration',
    description: 'Register attendees for your event',
    category: 'registration',
    icon: '📝',
    questions: [
      {
        type: 'short_text',
        title: 'Full Name',
        required: true,
        options: {
          placeholder: 'Enter your full name',
        },
      },
      {
        type: 'short_text',
        title: 'Email Address',
        required: true,
        options: {
          validation: 'email',
          placeholder: 'your.email@example.com',
        },
      },
      {
        type: 'short_text',
        title: 'Phone Number',
        required: false,
        options: {
          placeholder: '+1 (555) 123-4567',
        },
      },
      {
        type: 'multiple_choice',
        title: 'Ticket Type',
        required: true,
        options: {
          choices: [
            { id: '1', label: 'General Admission' },
            { id: '2', label: 'VIP Pass' },
            { id: '3', label: 'Student Ticket' },
          ],
        },
      },
      {
        type: 'checkboxes',
        title: 'Dietary Requirements',
        required: false,
        options: {
          choices: [
            { id: '1', label: 'Vegetarian' },
            { id: '2', label: 'Vegan' },
            { id: '3', label: 'Gluten-Free' },
            { id: '4', label: 'Halal' },
            { id: '5', label: 'Kosher' },
          ],
          allowOther: true,
        },
      },
      {
        type: 'long_text',
        title: 'Special Accommodations',
        description: 'Let us know if you need any special accommodations',
        required: false,
        options: {
          placeholder: 'Please describe any special needs...',
          rows: 3,
        },
      },
    ],
  },

  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Simple contact form for inquiries',
    category: 'other',
    icon: '✉️',
    questions: [
      {
        type: 'short_text',
        title: 'Name',
        required: true,
        options: {
          placeholder: 'Your name',
        },
      },
      {
        type: 'short_text',
        title: 'Email',
        required: true,
        options: {
          validation: 'email',
          placeholder: 'your.email@example.com',
        },
      },
      {
        type: 'dropdown',
        title: 'Subject',
        required: true,
        options: {
          choices: [
            { id: '1', label: 'General Inquiry' },
            { id: '2', label: 'Technical Support' },
            { id: '3', label: 'Sales Question' },
            { id: '4', label: 'Partnership Opportunity' },
            { id: '5', label: 'Feedback' },
          ],
        },
      },
      {
        type: 'long_text',
        title: 'Message',
        required: true,
        options: {
          placeholder: 'How can we help you?',
          rows: 5,
        },
      },
    ],
  },

  // Assessment Template
  {
    id: 'employee-evaluation',
    name: 'Employee Performance Review',
    description: 'Evaluate employee performance',
    category: 'assessment',
    icon: '📋',
    questions: [
      {
        type: 'short_text',
        title: 'Employee Name',
        required: true,
        options: {
          placeholder: 'Full name',
        },
      },
      {
        type: 'short_text',
        title: 'Department',
        required: true,
        options: {
          placeholder: 'e.g., Engineering, Marketing',
        },
      },
      {
        type: 'date_time',
        title: 'Review Period',
        description: 'Select the end date of the review period',
        required: true,
        options: {
          includeDate: true,
          includeTime: false,
        },
      },
      {
        type: 'matrix',
        title: 'Rate performance in the following areas',
        required: true,
        options: {
          type: 'radio',
          rows: [
            { id: '1', label: 'Quality of Work' },
            { id: '2', label: 'Productivity' },
            { id: '3', label: 'Communication' },
            { id: '4', label: 'Teamwork' },
            { id: '5', label: 'Initiative' },
          ],
          columns: [
            { id: '1', label: 'Needs Improvement' },
            { id: '2', label: 'Meets Expectations' },
            { id: '3', label: 'Exceeds Expectations' },
            { id: '4', label: 'Outstanding' },
          ],
          requiredRows: ['1', '2', '3'],
        },
      },
      {
        type: 'long_text',
        title: 'Key Achievements',
        required: false,
        options: {
          placeholder: 'Describe notable accomplishments...',
          rows: 4,
        },
      },
      {
        type: 'long_text',
        title: 'Areas for Development',
        required: false,
        options: {
          placeholder: 'Identify areas for growth...',
          rows: 4,
        },
      },
    ],
  },

  // Quick Templates
  {
    id: 'yes-no-poll',
    name: 'Simple Yes/No Poll',
    description: 'Quick yes/no question',
    category: 'survey',
    icon: '👍',
    questions: [
      {
        type: 'multiple_choice',
        title: 'Your Question Here',
        description: 'Replace with your actual question',
        required: true,
        options: {
          choices: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
        },
      },
      {
        type: 'long_text',
        title: 'Please explain your answer (optional)',
        required: false,
        options: {
          placeholder: 'Share your thoughts...',
          rows: 3,
        },
      },
    ],
  },

  {
    id: 'rating-scale',
    name: 'Rating Scale Survey',
    description: 'Collect ratings on multiple items',
    category: 'survey',
    icon: '⭐',
    questions: [
      {
        type: 'matrix',
        title: 'Please rate the following',
        description: 'Rate each item on a scale of 1-5',
        required: true,
        options: {
          type: 'radio',
          rows: [
            { id: '1', label: 'Item 1' },
            { id: '2', label: 'Item 2' },
            { id: '3', label: 'Item 3' },
          ],
          columns: [
            { id: '1', label: '1' },
            { id: '2', label: '2' },
            { id: '3', label: '3' },
            { id: '4', label: '4' },
            { id: '5', label: '5' },
          ],
        },
      },
    ],
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: FormTemplate['category']): FormTemplate[] {
  return FORM_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find((template) => template.id === id);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): Array<{
  id: FormTemplate['category'];
  label: string;
  description: string;
}> {
  return [
    {
      id: 'feedback',
      label: 'Feedback',
      description: 'Collect feedback and satisfaction ratings',
    },
    {
      id: 'survey',
      label: 'Survey',
      description: 'Conduct surveys and market research',
    },
    {
      id: 'registration',
      label: 'Registration',
      description: 'Register attendees and collect information',
    },
    {
      id: 'assessment',
      label: 'Assessment',
      description: 'Evaluate performance and conduct reviews',
    },
    {
      id: 'quiz',
      label: 'Quiz',
      description: 'Create quizzes and tests',
    },
    {
      id: 'other',
      label: 'Other',
      description: 'General purpose forms',
    },
  ];
}

'use client'

import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { FieldError } from 'react-hook-form'

// Form Field Wrapper
interface FormFieldProps {
  label: string
  error?: FieldError
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({ label, error, required, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}
    </div>
  )
}

// Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: FieldError
}

export function Input({ error, className = '', ...props }: InputProps) {
  const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors'
  const errorClasses = error ? 'border-red-300' : 'border-gray-300'
  
  return (
    <input
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  )
}

// Select Component
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: FieldError
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ error, options, placeholder, className = '', ...props }: SelectProps) {
  const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors'
  const errorClasses = error ? 'border-red-300' : 'border-gray-300'
  
  return (
    <select
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

// Textarea Component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: FieldError
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical'
  const errorClasses = error ? 'border-red-300' : 'border-gray-300'
  
  return (
    <textarea
      className={`${baseClasses} ${errorClasses} ${className}`}
      rows={3}
      {...props}
    />
  )
}

// Checkbox Component
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
}

export function Checkbox({ label, error, className = '', ...props }: CheckboxProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center">
        <input
          type="checkbox"
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          {...props}
        />
        <label className="ml-2 block text-sm text-gray-700">
          {label}
        </label>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}
    </div>
  )
}

// Date Range Picker Component
interface DateRangeProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  label?: string
  error?: FieldError
}

export function DateRange({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  label = 'Date Range',
  error 
}: DateRangeProps) {
  return (
    <FormField label={label} error={error}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            max={endDate || undefined}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate || undefined}
          />
        </div>
      </div>
    </FormField>
  )
}

// Form Actions Component
interface FormActionsProps {
  onCancel: () => void
  onSubmit?: () => void
  submitText?: string
  cancelText?: string
  isLoading?: boolean
  submitDisabled?: boolean
}

export function FormActions({ 
  onCancel, 
  onSubmit, 
  submitText = 'Save', 
  cancelText = 'Cancel',
  isLoading = false,
  submitDisabled = false
}: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {cancelText}
      </button>
      <button
        type={onSubmit ? 'button' : 'submit'}
        onClick={onSubmit}
        disabled={isLoading || submitDisabled}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Loading...' : submitText}
      </button>
    </div>
  )
}
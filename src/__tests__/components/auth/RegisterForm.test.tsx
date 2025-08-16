
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useAuthStore } from '@/stores/authStore'

// Mock the auth store
jest.mock('@/stores/authStore')

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

describe('RegisterForm', () => {
  const mockRegister = jest.fn()
  const mockClearError = jest.fn()

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      register: mockRegister,
      loading: false,
      error: null,
      clearError: mockClearError,
      user: null,
      session: null,
      login: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      updateProfile: jest.fn(),
      initialize: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const renderRegisterForm = () => {
    return render(
      <ChakraProvider>
        <RegisterForm />
      </ChakraProvider>
    )
  }

  it('renders registration form with all required fields', () => {
    renderRegisterForm()

    expect(screen.getByText('Create Account', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preferred currency/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    renderRegisterForm()

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('calls register function with form data on valid submission', async () => {
    renderRegisterForm()

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled()
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        timezone: '',
        preferredCurrency: ''
      })
    })
  })

  it('shows loading state during form submission', () => {
    mockUseAuthStore.mockReturnValue({
      register: mockRegister,
      loading: true,
      error: null,
      clearError: mockClearError,
      user: null,
      session: null,
      login: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      updateProfile: jest.fn(),
      initialize: jest.fn(),
    })

    renderRegisterForm()

    expect(screen.getByText(/creating account/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('displays error message when registration fails', () => {
    mockUseAuthStore.mockReturnValue({
      register: mockRegister,
      loading: false,
      error: 'Email already exists',
      clearError: mockClearError,
      user: null,
      session: null,
      login: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      updateProfile: jest.fn(),
      initialize: jest.fn(),
    })

    renderRegisterForm()

    expect(screen.getByText('Email already exists')).toBeInTheDocument()
  })

  it('validates password strength requirements', async () => {
    renderRegisterForm()

    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // Fill other required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })

    // Test weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 12 characters/i)).toBeInTheDocument()
    })
  })
})

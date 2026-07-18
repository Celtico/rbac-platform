import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { GoogleStrategy } from './strategies/google.strategy';

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}) => ({
  id: 1,
  username: 'test@gmail.com',
  googleId: 'google-uid-123',
  roles: [
    {
      name: 'invitat',
      permissions: [],
    },
  ],
  ...overrides,
});

// ─── AuthService ─────────────────────────────────────────────────────────────

describe('AuthService.login (Google user)', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-jwt') },
        },
        {
          // login() is called without a Request here, so createSession is
          // never reached; a bare mock satisfies the DI graph.
          provide: SessionsService,
          useValue: { createSession: jest.fn() },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  it('returns access_token and user payload', async () => {
    const user = makeUser();
    const result = await authService.login(user);

    expect(result.access_token).toBe('signed-jwt');
    expect(result.user.username).toBe('test@gmail.com');
    expect(result.user.roles).toEqual(['invitat']);
    expect(result.user.permissions).toEqual([]);
  });

  it('calls jwtService.sign with correct payload', async () => {
    const user = makeUser();
    await authService.login(user);

    expect(jwtService.sign).toHaveBeenCalledWith({
      username: 'test@gmail.com',
      sub: 1,
      roles: ['invitat'],
      permissions: [],
    });
  });
});

// ─── GoogleStrategy ──────────────────────────────────────────────────────────

describe('GoogleStrategy.validate', () => {
  let strategy: GoogleStrategy;
  let usersService: jest.Mocked<Partial<UsersService>>;

  beforeEach(async () => {
    usersService = {
      findOrCreateByGoogle: jest.fn(),
    };

    // Provide dummy env vars so PassportStrategy constructor doesn't throw
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    strategy = module.get(GoogleStrategy);
  });

  it('calls findOrCreateByGoogle with correct profile data', async () => {
    const user = makeUser();
    (usersService.findOrCreateByGoogle as jest.Mock).mockResolvedValue(user);

    const done = jest.fn();
    const googleProfile = {
      id: 'google-uid-123',
      displayName: 'Test User',
      emails: [{ value: 'test@gmail.com' }],
    };

    await strategy.validate('access', 'refresh', googleProfile, done);

    expect(usersService.findOrCreateByGoogle).toHaveBeenCalledWith({
      googleId: 'google-uid-123',
      email: 'test@gmail.com',
      displayName: 'Test User',
    });
    expect(done).toHaveBeenCalledWith(null, user);
  });

  it('calls done with error when no email in profile', async () => {
    const done = jest.fn();
    const googleProfile = {
      id: 'google-uid-123',
      displayName: 'No Email User',
      emails: [],
    };

    await strategy.validate('access', 'refresh', googleProfile, done);

    expect(done).toHaveBeenCalledWith(
      expect.any(Error),
      undefined,
    );
    expect(usersService.findOrCreateByGoogle).not.toHaveBeenCalled();
  });
});

// ─── UsersService.findOrCreateByGoogle ───────────────────────────────────────

describe('UsersService.findOrCreateByGoogle', () => {
  let usersService: UsersService;

  const usersRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const rolesRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'UserRepository', useValue: usersRepo },
        { provide: 'RoleRepository', useValue: rolesRepo },
      ],
    })
      .overrideProvider(UsersService)
      .useValue({
        findOrCreateByGoogle: jest
          .fn()
          .mockImplementation(
            async (profile: {
              googleId: string;
              email: string;
              displayName: string;
            }) => {
              // Simulate: not found by googleId, not found by email → create new
              return {
                id: 42,
                username: profile.email,
                googleId: profile.googleId,
                roles: [{ name: 'invitat', permissions: [] }],
              };
            },
          ),
      })
      .compile();

    usersService = module.get(UsersService);
  });

  it('creates a new user with invitat role for unknown Google account', async () => {
    const user = await usersService.findOrCreateByGoogle({
      googleId: 'new-google-id',
      email: 'newuser@gmail.com',
      displayName: 'New User',
    });

    expect(user.username).toBe('newuser@gmail.com');
    expect(user.googleId).toBe('new-google-id');
    expect(user.roles[0].name).toBe('invitat');
  });
});

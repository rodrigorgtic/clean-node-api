// eslint-disable-next-line max-classes-per-file
const LoginRouter = require('./login-router');
const MissingParamError = require('../helpers/missing-param-error');
const UnauthorizedError = require('../helpers/unauthorized-error');
const ServerError = require('../helpers/server-error');

// Design Pattern Factory.
const makeAuthUseCase = () => {
  // Mock para capturar valor para comparar.
  class AuthUseCaseSpy {
    async auth(email, password) {
      this.email = email;
      this.password = password;

      return this.accessToken;
    }
  }

  return new AuthUseCaseSpy();
};

const makeSut = () => {
  // Dependency Injector
  const authUseCaseSpy = makeAuthUseCase();
  authUseCaseSpy.accesToken = 'valid_token';

  // Set default token case route not set acess token.
  // authUseCaseSpy.accessToken = 'valid_token';

  const sut = new LoginRouter(authUseCaseSpy);

  return {
    sut, authUseCaseSpy,
  };
};

const makeAuthUseCaseWithError = () => {
  class AuthUseCaseSpy {
    async auth() {
      throw new Error();
    }
  }

  return new AuthUseCaseSpy();
};

describe('Login Router', () => {
  test('Should return 400 if no email is provided', async () => {
    /* sut = system under test.
    Nomenclatura que refere-se a um sistema que está sendo testado para operação correta. */
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('email'));
  });

  test('Should return 400 if no password is provided', async () => {
    /* sut = system under test.
    Nomenclatura que refere-se a um sistema que está sendo testado para operação correta. */
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        email: 'any@email.com',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('password'));
  });

  test('Should return 500 if no httpRequest is provided', async () => {
    const { sut } = makeSut();

    const httpResponse = await sut.route();
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should return 500 if no httpRequest has no body', async () => {
    const { sut } = makeSut();

    const httpResponse = await sut.route({});
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should call AuthUseCase with corret params', async () => {
    const { sut, authUseCaseSpy } = makeSut();
    const httpRequest = {
      body: {
        email: 'any@email.com',
        password: 'any_password',
      },
    };

    await sut.route(httpRequest);
    expect(authUseCaseSpy.email).toBe(httpRequest.body.email);
    expect(authUseCaseSpy.password).toBe(httpRequest.body.password);
  });

  // 401 quando o sistema não identifica o usuário.
  // 403 quando o sistema identifica o usuário, mas ele não ter permissão para executar a ação.
  test('Should return 401 when invalid credentials are provided', async () => {
    const { sut, authUseCaseSpy } = makeSut();

    authUseCaseSpy.accesToken = null;

    const httpRequest = {
      body: {
        email: 'invalid_email@email.com',
        password: 'invalid_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(401);
    expect(httpResponse.body).toEqual(new UnauthorizedError());
  });

  test('Should return 200 when valid credentials are provided', async () => {
    const { sut, authUseCaseSpy } = makeSut();

    authUseCaseSpy.accessToken = 'valid_token';

    const httpRequest = {
      body: {
        email: 'valid_email@email.com',
        password: 'valid_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);

    expect(httpResponse.statusCode).toBe(200);

    expect(httpResponse.body.accessToken).toEqual(authUseCaseSpy.accessToken);
  });

  test('Should return 500 if no AuthUseCase is provided', async () => {
    const sut = new LoginRouter();

    const httpRequest = {
      body: {
        email: 'any_email@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should return 500 if no AuthUseCase has no auth method', async () => {
    const sut = new LoginRouter({});

    const httpRequest = {
      body: {
        email: 'any_email@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should return 500 if AuthUseCase throws', async () => {
    const authUseCaseSpy = makeAuthUseCaseWithError();
    // authUseCaseSpy.accesToken = 'valid_token';
    const sut = new LoginRouter(authUseCaseSpy);

    const httpRequest = {
      body: {
        email: 'any_email@email.com',
        password: 'any_password',
      },
    };

    const httpResponse = await sut.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
  });

  // test('Should return 400 if an invalid email is provided', async () => {
  //   const { sut } = makeSut();
  //   const httpRequest = {
  //     body: {
  //       email: 'invalid_email',
  //       password: 'any_password',
  //     },
  //   };

  //   const httpResponse = await sut.route(httpRequest);
  //   expect(httpResponse.statusCode).toBe(400);
  //   expect(httpResponse.body).toEqual(new InvalidParamError('email'));
  // });
});

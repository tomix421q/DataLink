import nodes7 from 'nodes7'

export async function verifyPlcTag(
  ip: string,
  rack: number,
  slot: number,
  plcAddress: string,
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const conn = new nodes7({ silent: true })

    conn.initiateConnection({ port: 102, host: ip, rack, slot }, (err: any) => {
      if (err) {
        conn.dropConnection(() => {})
        return resolve({
          ok: false,
          error: 'Plc is offline try again later.',
        })
      }
      conn.setTranslationCB((tag: string) => {
        if (tag === 'TEST_TAG') return plcAddress
        return undefined
      })
      conn.addItems(['TEST_TAG'])
      conn.readAllItems((readErr: any, values: any) => {
        conn.dropConnection(() => {})
        if (readErr) {
          return resolve({ ok: false, error: `This tag has no data: ${readErr.code || 'Tag address does not exist'}` })
        }
        if (!values || values['TEST_TAG'] === undefined) {
          return resolve({ ok: false, error: 'Plc did not return tag value data' })
        }
        resolve({ ok: true })
      })
    })
  })
}
